import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { UserMenu } from "@/components/user-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { FloatingHelp } from "@/components/floating-help";
import { AppSidebar } from "@/components/app-sidebar";

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
    <div className="min-h-screen bg-background flex">
      <AppSidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="glass sticky top-0 z-30 border-b">
          <div className="flex items-center justify-end gap-1 h-16 px-4 lg:pl-6 lg:pr-6">
            <ThemeToggle />
            <UserMenu
              email={user.email ?? ""}
              fullName={profile?.full_name ?? user.email?.split("@")[0] ?? ""}
              avatarUrl={profile?.avatar_url ?? null}
            />
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </div>
      <FloatingHelp />
    </div>
  );
}
