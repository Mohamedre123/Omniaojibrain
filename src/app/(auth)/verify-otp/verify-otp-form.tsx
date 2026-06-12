"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { Mail, RefreshCw, Loader2, CheckCircle2, ExternalLink } from "lucide-react";

export function VerifyOtpForm() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") || "";
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(60);
  const [verified, setVerified] = useState(false);
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // عدّاد إعادة الإرسال
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  // اكتشاف التفعيل تلقائياً — بتحقّق حقيقي من السيرفر (مش كوكيز قديمة)
  useEffect(() => {
    if (!email || verified) return;
    const supabase = createClient();
    let cancelled = false;

    function confirmAndGo() {
      if (cancelled) return;
      setVerified(true);
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      toast.success("تمّ تفعيل الحساب 🎉");
      setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 1000);
    }

    async function init() {
      // 🧹 أولاً: لو فيه جلسة قديمة محفوظة في المتصفح، تحقّق منها من السيرفر
      const { data: { user }, error } = await supabase.auth.getUser();

      if (user && !error) {
        if (user.email?.toLowerCase() === email.toLowerCase() && user.email_confirmed_at) {
          // جلسة حقيقية لنفس الإيميل ومفعّلة → كمّل
          confirmAndGo();
          return;
        }
        // جلسة لحساب مختلف → سجّل خروج صامت عشان متلخبطش الصفحة
        if (user.email?.toLowerCase() !== email.toLowerCase()) {
          await supabase.auth.signOut().catch(() => {});
        }
      } else if (error) {
        // كوكيز بايظة/جلسة منتهية → نضّفها
        await supabase.auth.signOut().catch(() => {});
      }

      // فحص دوري بتحقّق سيرفر فعلي (يكتشف لو ضغط لينك التفعيل في تاب تاني)
      pollIntervalRef.current = setInterval(async () => {
        const { data: { user: u }, error: e } = await supabase.auth.getUser();
        if (
          u && !e &&
          u.email?.toLowerCase() === email.toLowerCase() &&
          u.email_confirmed_at
        ) {
          confirmAndGo();
        }
      }, 4000);
    }

    void init();

    // الاستماع لدخول حقيقي بنفس الإيميل فقط
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (
        event === "SIGNED_IN" &&
        session?.user.email?.toLowerCase() === email.toLowerCase()
      ) {
        confirmAndGo();
      }
    });

    return () => {
      cancelled = true;
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      subscription.unsubscribe();
    };
  }, [email, verified, router]);

  /** تأكيد بكود الأرقام — مثالي للموبايل (تكتبه في متصفحك الأساسي) */
  async function submitCode() {
    const token = code.replace(/\D/g, "");
    if (token.length < 6 || token.length > 10) {
      toast.error("اكتب الرمز كاملاً كما في الرسالة");
      return;
    }
    setSubmitting(true);
    const supabase = createClient();
    const types = ["signup", "email"] as const;
    let lastError = "";
    for (const type of types) {
      const { error } = await supabase.auth.verifyOtp({ email, token, type });
      if (!error) {
        setVerified(true);
        toast.success("تمّ تفعيل الحساب 🎉");
        setTimeout(() => {
          router.push("/dashboard");
          router.refresh();
        }, 1000);
        setSubmitting(false);
        return;
      }
      lastError = error.message;
    }
    setSubmitting(false);
    toast.error("الكود غير صحيح أو منتهي", { description: lastError });
  }

  async function resendEmail() {
    if (!email || resending || cooldown > 0) return;
    setResending(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resend({ type: "signup", email });
    setResending(false);

    if (error) {
      const msg = error.message || "";
      if (msg.toLowerCase().includes("rate") || msg.includes("after")) {
        toast.error("حاول بعد دقيقة", { description: "تجاوزت الحدّ المسموح من الإرسال" });
      } else {
        toast.error("تعذّر الإرسال", { description: msg });
      }
      return;
    }

    toast.success("تمّ إرسال رسالةٍ جديدة");
    setCooldown(60);
  }

  if (!email) {
    return (
      <div className="text-center space-y-4 py-4">
        <p className="text-sm text-muted-foreground">لم نجد بريدَك. أعد التسجيل من البداية.</p>
        <Button asChild variant="gradient" className="w-full">
          <Link href="/signup">صفحة التسجيل</Link>
        </Button>
      </div>
    );
  }

  if (verified) {
    return (
      <div className="text-center space-y-4 py-8">
        <div className="mx-auto size-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 grid place-items-center">
          <CheckCircle2 className="size-10 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h2 className="text-xl font-bold">تمّ تفعيل الحساب</h2>
        <p className="text-sm text-muted-foreground">جاري التوجيه...</p>
        <Loader2 className="size-5 animate-spin mx-auto text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-5 py-2">
      <div className="text-center">
        <div className="relative mx-auto size-16 rounded-full gradient-brand grid place-items-center mb-4">
          <Mail className="size-8 text-white" />
          <span className="absolute -top-1 -right-1 size-4 bg-emerald-400 rounded-full ring-2 ring-background animate-pulse" />
        </div>
        <h1 className="text-2xl font-bold">تحقّق من بريدك</h1>
        <p className="text-sm text-muted-foreground mt-2">
          أرسلنا رسالة تفعيلٍ إلى
        </p>
        <p className="font-medium mt-1 break-all">{email}</p>
      </div>

      {/* الطريقة 1: كود 6 أرقام — الأفضل للموبايل */}
      <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-4 space-y-3">
        <p className="font-semibold text-sm text-center">✍️ اكتب الكود المكوّن من 6 أرقام الموجود في الرسالة</p>
        <div className="flex gap-2" dir="ltr">
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={10}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            onKeyDown={(e) => { if (e.key === "Enter") void submitCode(); }}
            placeholder="123456"
            className="flex-1 h-12 text-center text-2xl font-bold tracking-[0.5em] rounded-lg border border-input bg-background focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            disabled={submitting}
          />
          <Button onClick={submitCode} disabled={submitting || code.length < 6} variant="gradient" className="h-12 px-6">
            {submitting ? <Loader2 className="size-4 animate-spin" /> : "تأكيد"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground text-center">
          💡 على الموبايل؟ اقرأ الكود من الإيميل وارجع هنا واكتبه — هتسجّل دخول في متصفحك مباشرة
        </p>
      </div>

      {/* الطريقة 2: الرابط */}
      <div className="rounded-lg border bg-muted/30 p-3 flex items-start gap-3">
        <div className="size-7 rounded-full bg-primary/15 text-primary grid place-items-center shrink-0">
          <ExternalLink className="size-3.5" />
        </div>
        <div className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">أو اضغط رابط التفعيل في الرسالة</span> — سنكتشف التفعيل تلقائياً وننقلك للداشبورد.
        </div>
        <Loader2 className="size-3.5 animate-spin shrink-0 mt-1" />
      </div>

      <div className="border-t pt-4 space-y-3">
        <div className="text-center text-sm">
          <span className="text-muted-foreground">لم يصلك البريد؟ </span>
          {cooldown > 0 ? (
            <span className="text-muted-foreground">إعادة الإرسال بعد {cooldown}ث</span>
          ) : (
            <button
              type="button"
              onClick={resendEmail}
              disabled={resending}
              className="text-primary font-medium hover:underline disabled:opacity-50 inline-flex items-center gap-1"
            >
              {resending ? (
                <><Loader2 className="size-3 animate-spin" />جاري الإرسال...</>
              ) : (
                <><RefreshCw className="size-3" />أعد الإرسال</>
              )}
            </button>
          )}
        </div>

        <div className="text-center text-xs text-muted-foreground space-y-1">
          <p>💡 لو ما لقتش الرسالة، افحص مجلد الـ Spam.</p>
        </div>

        <div className="text-center">
          <Link href="/signup" className="text-xs text-muted-foreground hover:text-primary">
            ← العودة لصفحة التسجيل
          </Link>
        </div>
      </div>
    </div>
  );
}
