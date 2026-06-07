"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

export function VerifyOtpForm() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") || "";
  const [pending, startTransition] = useTransition();
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [code, setCode] = useState<string[]>(["", "", "", "", "", ""]);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // عدّاد إعادة الإرسال
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

    // لو اكتمل الكود، أرسله تلقائي
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
      const { error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: "signup",
      });

      if (error) {
        toast.error("الرمزُ غيرُ صحيحٍ أو منتهي الصلاحية", { description: error.message });
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

  async function resend() {
    if (!email || resending || cooldown > 0) return;
    setResending(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
    });
    setResending(false);
    if (error) {
      toast.error("تعذّر إعادة الإرسال", { description: error.message });
      return;
    }
    toast.success("تمّ إرسالُ رمزٍ جديد");
    setCooldown(60);
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
      <div className="text-center">
        <Label className="text-sm">أُرسل الرمز إلى</Label>
        <p className="font-medium mt-1 break-all">{email}</p>
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
            onClick={resend}
            disabled={resending}
            className="text-primary font-medium hover:underline disabled:opacity-50"
          >
            {resending ? "جاري الإرسال..." : "أعد الإرسال"}
          </button>
        )}
      </div>

      <div className="text-center text-xs">
        <Link href="/signup" className="text-muted-foreground hover:text-primary">
          العودة لصفحة التسجيل
        </Link>
      </div>
    </form>
  );
}
