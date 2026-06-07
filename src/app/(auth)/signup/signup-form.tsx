"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export function SignupForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [showPwd, setShowPwd] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const fullName = String(fd.get("full_name") ?? "");
    const email = String(fd.get("email") ?? "");
    const password = String(fd.get("password") ?? "");

    if (password.length < 6) {
      toast.error("يجب ألّا تقلَّ كلمة المرور عن 6 أحرف");
      return;
    }

    startTransition(async () => {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          // الـ emailRedirectTo يخلّي اللينك يرجع للموقع لو الإيميل بلينك
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        toast.error("تعذّر إنشاءُ الحساب", { description: error.message });
        return;
      }
      if (data.user && !data.session) {
        // المستخدم محتاج تأكيد — يا إما بلينك أو بكود OTP
        toast.success("تمّ! تحقّق من بريدك", {
          description: "إن وجدت رمزاً اكتبه هنا، أو اضغط الرابط في البريد",
        });
        router.push(`/verify-otp?email=${encodeURIComponent(email)}`);
        return;
      }
      toast.success("أهلاً بك في Oji Brain 🎉");
      router.push("/dashboard");
      router.refresh();
    });
  }

  async function handleGoogle() {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/dashboard` },
    });
    if (error) toast.error("حدثت مشكلة", { description: error.message });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="full_name">الاسم</Label>
        <Input id="full_name" name="full_name" required placeholder="اسمك الكامل" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">البريد الإلكتروني</Label>
        <Input id="email" name="email" type="email" required placeholder="you@example.com" autoComplete="email" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">كلمة المرور</Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPwd ? "text" : "password"}
            required
            minLength={6}
            placeholder="6 أحرفٍ على الأقل"
            autoComplete="new-password"
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
        إنشاء الحساب
      </Button>
      <div className="relative my-2">
        <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
        <div className="relative flex justify-center text-xs"><span className="bg-card px-2 text-muted-foreground">أو</span></div>
      </div>
      <Button type="button" variant="outline" className="w-full h-11" onClick={handleGoogle}>
        <svg className="size-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z"/>
          <path fill="#FBBC05" d="M5.84 14.09a7.21 7.21 0 0 1 0-4.59V6.66H2.18a11 11 0 0 0 0 9.84l3.66-2.84Z"/>
          <path fill="#EA4335" d="M12 4.75c1.61 0 3.06.55 4.21 1.64l3.15-3.15C17.45 1.49 14.97.5 12 .5 7.7.5 3.99 2.97 2.18 6.66l3.66 2.84C6.71 6.93 9.14 4.75 12 4.75Z"/>
        </svg>
        التسجيل باستخدام Google
      </Button>
    </form>
  );
}
