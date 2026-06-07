"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [pending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "");

    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      if (error) {
        toast.error("حدثت مشكلة", { description: error.message });
        return;
      }
      setSent(true);
    });
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle>استعادةُ كلمة المرور</CardTitle>
        <CardDescription>
          {sent
            ? "تمّ إرسالُ رابطِ إعادة تعيين كلمة المرور إلى بريدك"
            : "أدخل بريدك الإلكتروني، وسنرسل لك رابطاً لإعادة تعيين كلمة المرور"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!sent ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input id="email" name="email" type="email" required placeholder="you@example.com" />
            </div>
            <Button type="submit" variant="gradient" className="w-full h-11" disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              إرسال الرابط
            </Button>
          </form>
        ) : (
          <Link href="/login" className="text-center block text-sm text-primary hover:underline">
            العودة إلى صفحة الدخول
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
