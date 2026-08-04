import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { UserMenu } from "@/components/user-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { FloatingHelp } from "@/components/floating-help";
import { IconRail, ConsoleMobileNav, RailSearchButton } from "@/components/console-nav";
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
    <div className="min-h-screen">
      <AnimatedBackground />
      <IconRail />

      {/* عمود المحتوى — بجانب الريل (الريل على اليمين في RTL) */}
      <div className="lg:mr-16 flex min-h-screen flex-col">
        <header className="sticky top-0 z-30 h-14 border-b border-border bg-background/80 backdrop-blur-2xl safe-top relative">
          <span aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/35 to-transparent" />
          <div className="mx-auto max-w-[1400px] flex h-14 items-center gap-2 px-3 sm:px-5">
            <ConsoleMobileNav />
            <Link href="/dashboard" className="flex items-center gap-2 lg:hidden">
              <div className="size-8 rounded-md gradient-brand grid place-items-center"><Brain className="size-4 text-white" /></div>
              <span className="font-extrabold tracking-tight">Oji Brain</span>
            </Link>
            <span className="hidden lg:flex items-center gap-2 label-mono select-none">
              <span className="inline-block size-1.5 rounded-full bg-primary shadow-[0_0_8px_color-mix(in_oklab,var(--primary)_80%,transparent)]" />
              OJI CONSOLE
            </span>

            <div className="mr-auto flex items-center gap-1.5">
              <RailSearchButton />
              <ThemeToggle />
              <UserMenu
                email={user.email ?? ""}
                fullName={profile?.full_name ?? user.email?.split("@")[0] ?? ""}
                avatarUrl={profile?.avatar_url ?? null}
              />
            </div>
          </div>
        </header>

        <main className="flex-1 app-surface pb-[4.75rem] lg:pb-0">{children}</main>
        <SiteFooter />
      </div>

      <FloatingHelp />
      <CommandPalette />
    </div>
  );
}
