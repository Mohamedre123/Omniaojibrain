import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SignupForm } from "./signup-form";

export default function SignupPage() {
  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">ابدأ مجاناً ✨</CardTitle>
        <CardDescription>أنشئ حسابك في دقيقة — دون الحاجة لبطاقةٍ ائتمانية</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <SignupForm />
        <p className="text-center text-sm text-muted-foreground">
          لديك حسابٌ بالفعل؟{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            سجّل الدخول
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
