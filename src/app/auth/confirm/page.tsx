"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function AuthConfirmPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "fail">("loading");

  useEffect(() => {
    (async () => {
      const supabase = createClient();

      // الـ Supabase client بياخد الـ tokens من الـ hash تلقائياً
      // لكن نتأكد إن في session فعلية
      await new Promise(r => setTimeout(r, 500));
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        setStatus("success");
        setTimeout(() => {
          router.push("/dashboard");
          router.refresh();
        }, 1500);
      } else {
        setStatus("fail");
        setTimeout(() => router.push("/login"), 2500);
      }
    })();
  }, [router]);

  return (
    <div className="min-h-screen grid place-items-center p-4">
      <Card className="p-8 text-center max-w-md w-full">
        {status === "loading" && (
          <>
            <Loader2 className="size-12 mx-auto animate-spin text-primary mb-4" />
            <h1 className="text-xl font-bold">جاري تأكيد حسابك...</h1>
            <p className="text-sm text-muted-foreground mt-2">لحظات قليلة</p>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle2 className="size-12 mx-auto text-emerald-500 mb-4" />
            <h1 className="text-xl font-bold">تمّ التأكيد بنجاح ✓</h1>
            <p className="text-sm text-muted-foreground mt-2">جاري التحويل للداشبورد...</p>
          </>
        )}
        {status === "fail" && (
          <>
            <XCircle className="size-12 mx-auto text-destructive mb-4" />
            <h1 className="text-xl font-bold">تعذّر التأكيد</h1>
            <p className="text-sm text-muted-foreground mt-2">الرابط منتهي الصلاحية أو غير صحيح. جاري إعادة التحويل...</p>
          </>
        )}
      </Card>
    </div>
  );
}
