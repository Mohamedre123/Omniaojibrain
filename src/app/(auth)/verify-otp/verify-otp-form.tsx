"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Mail, RefreshCw, CheckCircle } from "lucide-react";

export function VerifyOtpForm() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") || "";
  const [pending, startTransition] = useTransition();
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(60); // عدّاد ابتدائي بعد التسجيل
  const [code, setCode] = useState<string[]>(["", "", "", "", "", ""]);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // عدّاد إعادة الإرسال — يبدأ من 60 ث لأن signup بعت إيميل بالفعل
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  // التركيز التلقائي على أول حقل
  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  function setDigit(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);

    if (digit && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }

    if (newCode.every((d) => d !== "") && index === 5) {
      void submit(newCode.join(""));
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === "ArrowLeft" && index < 5) {
      inputsRef.current[index + 1]?.focus();
    } else if (e.key === "ArrowRight" && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 0) return;
    const newCode = ["", "", "", "", "", ""];
    for (let i = 0; i < pasted.length; i++) newCode[i] = pasted[i];
    setCode(newCode);
    const last = Math.min(pasted.length, 5);
    inputsRef.current[last]?.focus();
    if (pasted.length === 6) void submit(pasted);
  }

  async function submit(token: string) {
    if (!email) {
      toast.error("البريد الإلكتروني مفقود — ارجع لصفحة التسجيل");
      return;
    }
    if (token.length !== 6) {
      toast.error("الرمزُ يجب أن يكون 6 أرقام");
      return;
    }

    startTransition(async () => {
      const supabase = createClient();

      // جرّب الأنواع المختلفة بالترتيب
      const types: Array<"signup" | "email" | "magiclink"> = ["signup", "email", "magiclink"];
      let success = false;
      let lastError: string | null = null;

      for (const type of types) {
        const { error } = await supabase.auth.verifyOtp({ email, token, type });
        if (!error) {
          success = true;
          break;
        }
        lastError = error.message;
      }

      if (!success) {
        toast.error("الرمزُ غيرُ صحيحٍ أو منتهي الصلاحية", {
          description: lastError || "اطلب رمزاً جديداً واستخدم الأحدث منهم.",
        });
        setCode(["", "", "", "", "", ""]);
        inputsRef.current[0]?.focus();
        return;
      }

      toast.success("تمّ تفعيل الحساب 🎉 أهلاً بك في Oji Brain");
      router.push("/dashboard");
      router.refresh();
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await submit(code.join(""));
  }

  /** إعادة إرسال يدوية بعد طلب المستخدم. */
  async function resendCode() {
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

    toast.success("تمّ إرسالُ رمزٍ جديد", { description: "استخدم الرمز الأحدث فقط" });
    setCooldown(60);
    setCode(["", "", "", "", "", ""]);
    inputsRef.current[0]?.focus();
  }

  if (!email) {
    return (
      <div className="text-center space-y-4">
        <p className="text-sm text-muted-foreground">لم نجد بريدَك. أعد التسجيل من البداية.</p>
        <Button asChild variant="gradient" className="w-full">
          <Link href="/signup">صفحة التسجيل</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-3 flex items-start gap-2">
        <CheckCircle className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-medium text-emerald-900 dark:text-emerald-100">تمّ إرسالُ رمزٍ إلى بريدك</p>
          <div className="text-emerald-700 dark:text-emerald-300 text-xs mt-0.5 flex items-center gap-1 break-all">
            <Mail className="size-3 shrink-0" />
            {email}
          </div>
        </div>
      </div>

      <div>
        <Label className="block text-center mb-3">أدخل الرمز المكوّنَ من 6 أرقام</Label>
        <div className="flex justify-center gap-2" dir="ltr">
          {code.map((digit, i) => (
            <input
              key={i}
              ref={(el) => {
                inputsRef.current[i] = el;
              }}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={1}
              value={digit}
              onChange={(e) => setDigit(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onPaste={handlePaste}
              className="w-12 h-14 text-center text-2xl font-bold rounded-lg border border-input bg-background focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              disabled={pending}
            />
          ))}
        </div>
      </div>

      <Button type="submit" variant="gradient" className="w-full h-11" disabled={pending || code.some((d) => !d)}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        تأكيد
      </Button>

      <div className="text-center text-sm">
        <span className="text-muted-foreground">لم يصلك الرمز؟ </span>
        {cooldown > 0 ? (
          <span className="text-muted-foreground">إعادة الإرسال بعد {cooldown}ث</span>
        ) : (
          <button
            type="button"
            onClick={resendCode}
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

      <div className="text-center text-xs text-muted-foreground space-y-1 pt-2 border-t">
        <p>💡 افحص مجلد الرسائل غير المرغوب فيها (Spam) أيضاً.</p>
        <p>⚠️ لو طلبتَ رمزاً جديداً، استخدم الأحدث فقط — السابق يُلغى.</p>
        <Link href="/signup" className="hover:text-primary inline-block mt-2">
          ← العودة لصفحة التسجيل
        </Link>
      </div>
    </form>
  );
}
