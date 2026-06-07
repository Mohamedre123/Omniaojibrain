"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { Sparkles, X, Wand2, Settings, HelpCircle, ArrowLeft } from "lucide-react";

export function WelcomeBanner({ fullName }: { fullName: string }) {
  const [dismissed, setDismissed] = useState(false);
  const [, startTransition] = useTransition();

  function dismiss() {
    setDismissed(true);
    startTransition(async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase
        .from("profiles")
        .update({ onboarded_at: new Date().toISOString() })
        .eq("id", user.id);
    });
  }

  if (dismissed) return null;

  return (
    <Card className="relative overflow-hidden mb-8 border-2 border-primary/20">
      <div className="gradient-brand absolute inset-0 opacity-5" />
      <div className="relative p-6">
        <button
          onClick={dismiss}
          className="absolute top-3 left-3 text-muted-foreground hover:text-foreground"
          aria-label="إغلاق"
        >
          <X className="size-4" />
        </button>
        <div className="flex items-center gap-3 mb-4">
          <div className="size-12 rounded-xl gradient-brand grid place-items-center text-white">
            <Sparkles className="size-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold">أهلاً بك {fullName} 👋</h2>
            <p className="text-sm text-muted-foreground">ثلاثُ خطواتٍ تساعدك على البداية الصحيحة</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Link href="/settings" className="group rounded-lg border bg-card p-4 hover:border-primary transition-all">
            <Settings className="size-5 text-primary mb-2" />
            <p className="font-semibold text-sm">عرّف Oji على هويّةِ علامتك</p>
            <p className="text-xs text-muted-foreground mt-1">دقيقتان تجعلانه يفكّر بأسلوبك</p>
            <span className="inline-flex items-center gap-1 mt-2 text-xs text-primary group-hover:gap-2 transition-all">
              إلى الإعدادات <ArrowLeft className="size-3" />
            </span>
          </Link>

          <div className="rounded-lg border bg-card p-4">
            <Wand2 className="size-5 text-primary mb-2" />
            <p className="font-semibold text-sm">جرّب Magic Brief ✨</p>
            <p className="text-xs text-muted-foreground mt-1">
              عند إنشاءِ المشروع، أدخل رابطاً يُملأ تلقائياً
            </p>
          </div>

          <div className="rounded-lg border bg-card p-4">
            <HelpCircle className="size-5 text-primary mb-2" />
            <p className="font-semibold text-sm">المساعدةُ في أيّ وقت</p>
            <p className="text-xs text-muted-foreground mt-1">
              زرُّ المساعدة يساعدك على أيّ شيء
            </p>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <Button variant="ghost" size="sm" onClick={dismiss}>
            حسناً، لنبدأ
          </Button>
        </div>
      </div>
    </Card>
  );
}
