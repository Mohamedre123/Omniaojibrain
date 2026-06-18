import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NewProjectDialog } from "./new-project-dialog";
import { WelcomeBanner } from "./welcome-banner";
import { BUSINESS_TEMPLATES } from "@/lib/templates";
import { Reveal } from "@/components/reveal";
import { relativeTime } from "@/lib/utils";
import { FolderPlus, FolderOpen, ArrowLeft } from "lucide-react";
import type { Project } from "@/types/db";

const COVER_COLORS: Record<string, string> = {
  violet: "from-violet-500 to-purple-600",
  blue: "from-blue-500 to-cyan-600",
  emerald: "from-emerald-500 to-teal-600",
  orange: "from-orange-500 to-pink-600",
  rose: "from-rose-500 to-fuchsia-600",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // جلب المشاريع والبروفايل بالتوازي — أسرع من واحدة ورا التانية
  const [{ data: projects }, { data: profile }] = await Promise.all([
    supabase
      .from("projects")
      .select("*")
      .not("business_type", "in", "(assistant,studio)")
      .order("updated_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("full_name, onboarded_at")
      .eq("id", user!.id)
      .single(),
  ]);

  const list = (projects ?? []) as Project[];
  const showWelcome = !profile?.onboarded_at;
  const firstName = (profile?.full_name ?? user?.email?.split("@")[0] ?? "").split(" ")[0];

  return (
    <div className="container mx-auto px-4 py-10">
      {showWelcome && <WelcomeBanner fullName={firstName} />}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">مشاريعي</h1>
          <p className="text-muted-foreground mt-1">
            جميعُ مشاريعك في مكانٍ واحد — ابدأ مشروعاً جديداً أو تابع مشروعاً قائماً.
          </p>
        </div>
        <NewProjectDialog />
      </div>

      {list.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((p, i) => {
            const tpl = BUSINESS_TEMPLATES.find((t) => t.id === p.business_type);
            return (
              <Reveal key={p.id} delay={(i % 6) * 70}>
              <Link href={`/projects/${p.id}`} className="block h-full">
                <Card className="group h-full overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1 cursor-pointer">
                  <div className={`h-24 bg-gradient-to-br ${COVER_COLORS[p.cover_color] ?? COVER_COLORS.violet} relative`}>
                    <div className="absolute inset-0 grid place-items-center text-5xl">
                      {tpl?.emoji ?? "✨"}
                    </div>
                  </div>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                      <span>{tpl?.name ?? "مشروع"}</span>
                      <span>•</span>
                      <span>{relativeTime(p.updated_at)}</span>
                    </div>
                    <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
                      {p.name}
                    </h3>
                    {p.brief && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {p.brief}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
              </Reveal>
            );
          })}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-20 border-2 border-dashed rounded-2xl">
      <div className="mx-auto size-16 rounded-full bg-primary/10 grid place-items-center mb-4">
        <FolderOpen className="size-8 text-primary" />
      </div>
      <h2 className="text-xl font-semibold mb-2">لا توجد مشاريعُ بعد</h2>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
        ابدأ مشروعك الأول الآن. اختر نوع نشاطك، واشرح فكرتك،
        ودع Oji Brain يتولّى الباقي.
      </p>
      <NewProjectDialog>
        <Button variant="gradient" size="lg">
          <FolderPlus className="size-5" />
          ابدأ مشروعك الأول
          <ArrowLeft className="size-4" />
        </Button>
      </NewProjectDialog>
    </div>
  );
}
