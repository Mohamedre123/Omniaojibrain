import { Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { VerifyOtpForm } from "./verify-otp-form";
import { Loader2 } from "lucide-react";

export default function VerifyOtpPage() {
  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto size-14 rounded-full gradient-brand grid place-items-center mb-3">
          <span className="text-2xl">🔐</span>
        </div>
        <CardTitle className="text-2xl">تأكيد البريد</CardTitle>
        <CardDescription>
          أرسلنا رسالةً إلى بريدك. <strong>إن وجدت رمزاً مكوّناً من 6 أرقام</strong>،
          أدخله أدناه. <strong>وإن وجدت رابطاً</strong>، اضغط عليه مباشرةً من البريد
          ليفعّل حسابك تلقائياً.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense fallback={
          <div className="flex justify-center py-6">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        }>
          <VerifyOtpForm />
        </Suspense>
      </CardContent>
    </Card>
  );
}
