import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { UserMenu } from "@/components/user-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { FloatingHelp } from "@/components/floating-help";
import { AppSidebar, SidebarTrigger } from "@/components/app-sidebar";
import { AnimatedBackground } from "@/components/animated-background";

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
      <AppSidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="glass sticky top-0 z-30 border-b safe-top">
          <div className="flex items-center justify-between gap-1 h-16 px-4 lg:px-6">
            {/* زر القائمة على الموبايل (مخفي على الديسكتوب) */}
            <SidebarTrigger />
            <div className="flex items-center gap-1 lg:mr-auto">
              <ThemeToggle />
              <UserMenu
                email={user.email ?? ""}
                fullName={profile?.full_name ?? user.email?.split("@")[0] ?? ""}
                avatarUrl={profile?.avatar_url ?? null}
              />
            </div>
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </div>
      <FloatingHelp />
    </div>
  );
}
