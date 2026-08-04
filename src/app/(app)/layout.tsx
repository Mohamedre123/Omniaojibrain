import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { UserMenu } from "@/components/user-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { FloatingHelp } from "@/components/floating-help";
import { TopNav } from "@/components/top-nav";
import { AnimatedBackground } from "@/components/animated-background";
import { SiteFooter } from "@/components/site-footer";
import { CommandPalette } from "@/components/command-palette";
import { PaletteButton } from "@/components/palette-button";

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
    <div className="min-h-screen flex flex-col">
      <AnimatedBackground />

      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-2xl safe-top relative">
        <span aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        <div className="mx-auto max-w-7xl flex items-center gap-2 h-16 px-3 sm:px-5">
          <TopNav />
          <div className="mr-auto flex items-center gap-1">
            <PaletteButton />
            <ThemeToggle />
            <UserMenu
              email={user.email ?? ""}
              fullName={profile?.full_name ?? user.email?.split("@")[0] ?? ""}
              avatarUrl={profile?.avatar_url ?? null}
            />
          </div>
        </div>
      </header>

      <main className="flex-1 app-surface">{children}</main>
      <SiteFooter />

      <FloatingHelp />
      <CommandPalette />
    </div>
  );
}
