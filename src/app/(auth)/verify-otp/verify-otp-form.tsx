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
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // عدّاد إعادة الإرسال
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  // قراءة الجلسة كلَّ 3 ثوانٍ — لاكتشاف التفعيل تلقائياً
  useEffect(() => {
    if (!email || verified) return;
    const supabase = createClient();

    async function check() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && session.user.email?.toLowerCase() === email.toLowerCase()) {
        setVerified(true);
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        toast.success("تمّ تفعيل الحساب 🎉");
        setTimeout(() => {
          router.push("/dashboard");
          router.refresh();
        }, 1200);
      }
    }

    // فحص فوري
    void check();

    // فحص دوري
    pollIntervalRef.current = setInterval(check, 3000);

    // الاستماع لتغيّر الجلسة في تابات أخرى (لو فتح اللينك في تاب جديد)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        setVerified(true);
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        toast.success("تمّ تفعيل الحساب 🎉");
        setTimeout(() => {
          router.push("/dashboard");
          router.refresh();
        }, 1200);
      }
    });

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      subscription.unsubscribe();
    };
  }, [email, verified, router]);

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

      <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className="size-8 rounded-full bg-primary/20 text-primary grid place-items-center shrink-0">
            <ExternalLink className="size-4" />
          </div>
          <div className="text-sm">
            <p className="font-semibold">افتح بريدك واضغط على رابط التفعيل</p>
            <p className="text-muted-foreground text-xs mt-1">
              سنُنقلك تلقائياً للداشبورد بمجرّد التفعيل.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-3">
        <Loader2 className="size-4 animate-spin" />
        <span>بانتظار التفعيل...</span>
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
