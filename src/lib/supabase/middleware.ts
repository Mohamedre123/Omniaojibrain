import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // لو الإعدادات ناقصة، نسيب الـ request يكمل ويظهر الخطأ في الصفحة بشكل أوضح
  if (!url || !key) {
    return response;
  }

  const supabase = createServerClient(
    url,
    key,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  // ملاحظة: /verify-otp مش هنا عمداً — لازم تفتح حتى لو فيه جلسة قديمة
  // (الصفحة نفسها بتتعامل مع الجلسات القديمة وبتسجّل خروج صامت لو لازم)
  const isAuthPage =
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/forgot-password");
  const isProtected =
    pathname.startsWith("/dashboard") || pathname.startsWith("/projects");

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // 🔒 امنع تخزين صفحات الحساب في أي كاش (CDN/متصفح) — حماية من تسرّب بيانات مستخدمٍ لآخر
  const isUserArea =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/projects") ||
    pathname.startsWith("/assistant") ||
    pathname.startsWith("/studio") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/marketing") ||
    pathname.startsWith("/insights") ||
    pathname.startsWith("/leads") ||
    pathname.startsWith("/brand") ||
    pathname.startsWith("/business") ||
    pathname.startsWith("/team") ||
    pathname.startsWith("/learn") ||
    pathname.startsWith("/calendar");
  if (isUserArea) {
    response.headers.set("Cache-Control", "private, no-store, no-cache, must-revalidate, max-age=0");
  }

  return response;
}
