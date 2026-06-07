import { Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { VerifyOtpForm } from "./verify-otp-form";
import { Loader2 } from "lucide-react";

export default function VerifyOtpPage() {
  return (
    <Card>
      <CardContent className="pt-6">
        <Suspense fallback={
          <div className="flex justify-center py-10">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        }>
          <VerifyOtpForm />
        </Suspense>
      </CardContent>
    </Card>
  );
}
