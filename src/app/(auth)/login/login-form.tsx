"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get("redirect") ?? "/dashboard";
  const [pending, startTransition] = useTransition();
  const [showPwd, setShowPwd] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "").trim().toLowerCase();
    const password = String(fd.get("password") ?? "");

    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (!error) {
        toast.success("تمّ تسجيل الدخول");
        router.push(redirect);
        router.refresh();
        return;
      }

      const msg = (error.message || "").toLowerCase();

      // الحالة الذكية: المستخدم موجود لكن بريده غير مؤكّد
      // Supabase يرجع "Email not confirmed" أو في بعض الإصدارات
      // يدمج الخطأ تحت "Invalid login credentials" لأسباب أمنية.
      if (msg.includes("not confirmed") || msg.includes("email not")) {
        toast.info("بريدُك غيرُ مؤكّد", {
          description: "نرسلُ لك رمزَ التأكيد الآن…",
        });
        // أرسل رمز التأكيد ووجّه المستخدم لصفحة التحقّق
        await supabase.auth.resend({ type: "signup", email }).catch(() => {});
        router.push(`/verify-otp?email=${encodeURIComponent(email)}`);
        return;
      }

      // لو الخطأ "Invalid credentials"، جرّب نتحقّق إن كان المستخدم موجوداً وغير مؤكّد
      // عن طريق محاولة إرسال OTP — لو الإيميل موجود، signInWithOtp ينجح
      if (msg.includes("invalid") || msg.includes("credentials")) {
        // نحاول إرسال OTP بحيث shouldCreateUser=false
        const { error: otpError } = await supabase.auth.signInWithOtp({
          email,
          options: { shouldCreateUser: false },
        });

        // لو نجح إرسال الـ OTP → معناها الإيميل موجود لكن غير مؤكّد (أو كلمة المرور غلط)
        if (!otpError) {
          toast.info("أرسلنا رمزَ تأكيدٍ إلى بريدك", {
            description: "إن كان بريدك غير مؤكّد، استخدم الرمز لإتمام التفعيل.",
          });
          router.push(`/verify-otp?email=${encodeURIComponent(email)}`);
          return;
        }

        // لو فشل OTP برضو → الإيميل غير مسجّل أصلاً، أو كلمة المرور غلط
        toast.error("بياناتُ الدخول غير صحيحة", {
          description: "تأكّد من الإيميل وكلمة المرور.",
        });
        return;
      }

      // أيّ خطأ آخر
      toast.error("تعذّر الدخول", { description: error.message });
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">البريد الإلكتروني</Label>
        <Input id="email" name="email" type="email" required placeholder="you@example.com" autoComplete="email" />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">كلمة المرور</Label>
          <Link href="/forgot-password" className="text-xs text-muted-foreground hover:text-primary">
            نسيتَ كلمة المرور؟
          </Link>
        </div>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPwd ? "text" : "password"}
            required
            placeholder="••••••••"
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowPwd((s) => !s)}
            className="absolute inset-y-0 left-3 grid place-items-center text-muted-foreground"
            aria-label="إظهار أو إخفاء كلمة المرور"
          >
            {showPwd ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>
      <Button type="submit" variant="gradient" className="w-full h-11" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        تسجيل الدخول
      </Button>
    </form>
  );
}
