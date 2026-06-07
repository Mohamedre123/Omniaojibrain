"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const isConfigError =
    error.message?.includes("Supabase") ||
    error.message?.includes("إعدادات") ||
    error.message?.includes("environment");

  return (
    <main className="min-h-screen grid place-items-center px-4 py-12 bg-background">
      <div className="max-w-lg w-full text-center">
        <div className="mx-auto size-20 rounded-full bg-destructive/10 grid place-items-center mb-6">
          <AlertTriangle className="size-10 text-destructive" />
        </div>

        <h1 className="text-2xl font-bold mb-3">
          {isConfigError ? "إعداداتُ الموقع ناقصة" : "حدثت مشكلةٌ غيرُ متوقّعة"}
        </h1>

        {isConfigError ? (
          <div className="space-y-4 text-right">
            <p className="text-muted-foreground leading-relaxed">
              يبدو أنّ بعضَ متغيّرات البيئة (Environment Variables) ناقصة. هذا يحدث
              غالباً بعد رفع الموقع على استضافةٍ جديدة دون إضافة المفاتيح.
            </p>

            <div className="rounded-lg border bg-card p-4 text-sm">
              <p className="font-semibold mb-2">المطلوبُ إضافته في لوحة الاستضافة:</p>
              <ul className="space-y-1.5 text-muted-foreground list-disc list-inside">
                <li><code className="text-foreground bg-muted px-1.5 py-0.5 rounded text-xs">NEXT_PUBLIC_SUPABASE_URL</code></li>
                <li><code className="text-foreground bg-muted px-1.5 py-0.5 rounded text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code></li>
                <li><code className="text-foreground bg-muted px-1.5 py-0.5 rounded text-xs">GEMINI_API_KEY</code></li>
                <li><code className="text-foreground bg-muted px-1.5 py-0.5 rounded text-xs">NEXT_PUBLIC_SITE_URL</code></li>
              </ul>
              <p className="text-xs text-muted-foreground mt-3 pt-3 border-t">
                💡 بعد إضافتها، يجب إعادةُ البناء (Rebuild) كاملاً، لا مجرّد إعادة تشغيل.
              </p>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground leading-relaxed mb-6">
            {error.message || "نأسف، حدث خطأٌ في الخادم. حاول مرّةً أخرى."}
          </p>
        )}

        <div className="flex gap-2 justify-center mt-6">
          <Button onClick={reset} variant="gradient">
            <RefreshCw className="size-4" />
            إعادةُ المحاولة
          </Button>
          <Button asChild variant="outline">
            <Link href="/">
              <Home className="size-4" />
              الصفحةُ الرئيسية
            </Link>
          </Button>
        </div>

        {error.digest && (
          <p className="text-xs text-muted-foreground mt-6 font-mono opacity-60">
            Ref: {error.digest}
          </p>
        )}
      </div>
    </main>
  );
}
