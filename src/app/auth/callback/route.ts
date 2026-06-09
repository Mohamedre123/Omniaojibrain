import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  const supabase = await createClient();

  // الحالة 1: PKCE code (Google OAuth أو signInWithOAuth)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }

  // الحالة 2: Token hash (يشتغل في أيّ متصفح — مثالي للموبايل)
  if (tokenHash) {
    const typesToTry = type
      ? [type, "signup", "email", "magiclink"]
      : ["signup", "email", "magiclink"];

    for (const t of [...new Set(typesToTry)]) {
      const { error } = await supabase.auth.verifyOtp({
        type: t as "signup" | "recovery" | "email_change" | "email" | "magiclink",
        token_hash: tokenHash,
      });
      if (!error) return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // الحالة 3: الـ Session اتعملت client-side (hash fragment)
  // نتحقّق من وجود session فعلي
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    return NextResponse.redirect(`${origin}${next}`);
  }

  // فشل — رجع المستخدم لصفحة OTP عشان يحاول تاني
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
