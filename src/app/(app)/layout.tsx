import Link from "next/link";
import { redirect } from "next/navigation";
import { Brain, Settings } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { UserMenu } from "@/components/user-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { FloatingHelp } from "@/components/floating-help";
import { Button } from "@/components/ui/button";

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
    <div className="min-h-screen bg-background flex flex-col">
      <header className="glass sticky top-0 z-40 border-b">
        <div className="container mx-auto h-16 px-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="size-9 rounded-lg gradient-brand grid place-items-center">
              <Brain className="size-5 text-white" />
            </div>
            <span className="text-xl font-bold">Oji Brain</span>
          </Link>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Button asChild variant="ghost" size="icon" aria-label="الإعدادات">
              <Link href="/settings" title="الإعدادات"><Settings className="size-5" /></Link>
            </Button>
            <UserMenu
              email={user.email ?? ""}
              fullName={profile?.full_name ?? user.email?.split("@")[0] ?? ""}
              avatarUrl={profile?.avatar_url ?? null}
            />
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <FloatingHelp />
    </div>
  );
}
