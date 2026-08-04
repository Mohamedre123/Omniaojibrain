import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { UserMenu } from "@/components/user-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { FloatingHelp } from "@/components/floating-help";
import { AppSidebar, SidebarTrigger, TopSearch } from "@/components/main-nav";
import { AnimatedBackground } from "@/components/animated-background";
import { SiteFooter } from "@/components/site-footer";
import { CommandPalette } from "@/components/command-palette";
import { Brain } from "lucide-react";

// 🔒 مهمّ جداً للأمان: كل صفحات الحساب تُرسَم لكل طلبٍ على حدة (لكل مستخدم)،
// وممنوع تخزينها في أي كاش — يمنع ظهور بيانات مستخدمٍ لمستخدمٍ آخر.
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen flex">
      <AnimatedBackground />

      {/* السايدبار القابل للطي (يمين في RTL) */}
      <AppSidebar />

      {/* عمود المحتوى */}
      <div className="flex min-h-screen flex-1 flex-col min-w-0">
        <header className="sticky top-0 z-30 h-16 border-b border-border bg-background/75 backdrop-blur-2xl safe-top relative">
          <span aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          <div className="flex h-16 items-center gap-2 px-3 sm:px-5">
            <SidebarTrigger />
            <Link href="/dashboard" className="flex items-center gap-2 lg:hidden">
              <div className="size-9 rounded-xl gradient-brand grid place-items-center"><Brain className="size-5 text-white" /></div>
              <span className="font-extrabold tracking-tight">Oji Brain</span>
            </Link>

            <div className="flex-1" />
            <TopSearch />
            <ThemeToggle />
            <UserMenu
              email={user.email ?? ""}
              fullName={profile?.full_name ?? user.email?.split("@")[0] ?? ""}
              avatarUrl={profile?.avatar_url ?? null}
            />
          </div>
        </header>

        <main className="flex-1 app-surface">{children}</main>
        <SiteFooter />
      </div>

      <FloatingHelp />
      <CommandPalette />
    </div>
  );
}
