import Link from "next/link";
import { Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "./login-form";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">أهلاً بعودتك 👋</CardTitle>
        <CardDescription>سجّل الدخول لمتابعة عملك</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Suspense fallback={
          <div className="flex justify-center py-6">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        }>
          <LoginForm />
        </Suspense>
        <p className="text-center text-sm text-muted-foreground">
          لا تملك حساباً؟{" "}
          <Link href="/signup" className="font-medium text-primary hover:underline">
            أنشئ حساباً جديداً
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
