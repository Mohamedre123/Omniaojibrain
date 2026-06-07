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
    const email = String(fd.get("email") ?? "").trim().toLowerCase();
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
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        const msg = error.message || "";
        if (msg.includes("rate limit") || msg.includes("after")) {
          toast.error("حاول بعد دقيقة", { description: "وصلت للحدّ المسموح من المحاولات." });
        } else if (msg.toLowerCase().includes("already registered")) {
          toast.error("هذا البريد مسجّلٌ بالفعل", { description: "سجّل الدخول بدلاً من ذلك." });
        } else {
          toast.error("تعذّر إنشاءُ الحساب", { description: error.message });
        }
        return;
      }

      // Supabase بترجع identities = [] لو المستخدم موجود بالفعل
      const isExistingUser = data.user && (!data.user.identities || data.user.identities.length === 0);
      if (isExistingUser) {
        toast.error("هذا البريد مسجّلٌ بالفعل", {
          description: "سجّل الدخول بدلاً من ذلك أو اطلب استعادة كلمة المرور.",
        });
        return;
      }

      if (data.session) {
        toast.success("أهلاً بك في Oji Brain 🎉");
        router.push("/dashboard");
        router.refresh();
        return;
      }

      toast.success("تمّ! تحقّق من بريدك", {
        description: "أرسلنا إليك رمز التأكيد",
      });
      router.push(`/verify-otp?email=${encodeURIComponent(email)}`);
    });
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
    </form>
  );
}
