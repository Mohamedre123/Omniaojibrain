import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NewProjectDialog } from "./new-project-dialog";
import { WelcomeBanner } from "./welcome-banner";
import { DashboardTools } from "@/components/dashboard-tools";
import { DashboardToday } from "@/components/dashboard-today";
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

const WORLDS = [
  { href: "/studio", emoji: "🎨", title: "الاستوديو", desc: "صور وفيديو بالـ AI", grad: "from-rose-500 to-pink-600" },
  { href: "/marketing", emoji: "📣", title: "التسويق", desc: "محتوى وإعلانات وتصميمات", grad: "from-orange-500 to-amber-600" },
  { href: "/automations", emoji: "⚙️", title: "الأتمتة والوكلاء", desc: "بوتات وأتمتة تشتغل لوحدها", grad: "from-sky-500 to-blue-600" },
  { href: "/insights", emoji: "📊", title: "الرؤى والتحليلات", desc: "تحليل ومنافسين وترندات", grad: "from-cyan-500 to-teal-600" },
  { href: "/leads", emoji: "🎯", title: "جذب العملاء", desc: "صفحات هبوط وشات بوت", grad: "from-violet-500 to-purple-600" },
  { href: "/brand", emoji: "🎭", title: "هوية العلامة", desc: "لوجو وألوان وكتاب علامة", grad: "from-fuchsia-500 to-pink-600" },
];

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
    <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-8">
      {showWelcome && <WelcomeBanner fullName={firstName} />}

      {/* هيرو — عنوان متدرّج + أزرار دائرية متوهّجة فوق الخلفية المتحرّكة */}
      <div className="relative text-center pt-8 pb-10 sm:pt-14 sm:pb-14 mb-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs text-primary mb-6">
          ✦ Oji Brain — عقلُ مشروعك الإبداعي
        </div>
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.1]">
          <span className="text-gradient">{firstName ? `أهلاً ${firstName}` : "أهلاً بيك"}</span>
        </h1>
        <p className="text-muted-foreground mt-4 text-base sm:text-lg max-w-xl mx-auto">
          كل أدواتك ومشاريعك في مكان واحد — اختار عالمك وابدأ تصنع.
        </p>
        <div className="mt-8 flex flex-wrap items-start justify-center gap-5 sm:gap-7">
          {WORLDS.slice(0, 4).map((w) => (
            <Link key={w.href} href={w.href} className="group flex flex-col items-center gap-2 w-20">
              <span className="glow-ring grid size-16 place-items-center rounded-2xl text-2xl transition-transform group-hover:scale-110 group-hover:-translate-y-1">{w.emoji}</span>
              <span className="text-[11px] text-muted-foreground group-hover:text-foreground transition-colors text-center leading-tight">{w.title}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* العوالم */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6">
        {WORLDS.map((w) => (
          <Link key={w.href} href={w.href} className="group relative overflow-hidden rounded-2xl p-5 min-h-[120px] flex flex-col justify-between border border-border bg-card/60 backdrop-blur-sm hover:border-primary/50 hover:bg-card transition-all">
            <span aria-hidden className={`pointer-events-none absolute -top-10 -left-10 size-28 rounded-full bg-gradient-to-br ${w.grad} opacity-25 blur-2xl group-hover:opacity-40 transition-opacity`} />
            <div className="relative text-3xl">{w.emoji}</div>
            <div className="relative">
              <div className="font-bold text-base leading-tight group-hover:text-primary transition-colors">{w.title}</div>
              <div className="text-muted-foreground text-xs mt-1">{w.desc}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* مهام اليوم + الأدوات السريعة */}
      <div className="grid gap-4 lg:grid-cols-3 mb-6">
        <div className="lg:col-span-2"><DashboardToday /></div>
        <div className="lg:col-span-1"><DashboardTools /></div>
      </div>

      {/* المشاريع */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <h2 className="text-xl font-bold">مشاريعي</h2>
        <NewProjectDialog />
      </div>

      {list.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {list.map((p, i) => {
            const tpl = BUSINESS_TEMPLATES.find((t) => t.id === p.business_type);
            return (
              <Reveal key={p.id} delay={(i % 8) * 55}>
              <Link href={`/projects/${p.id}`} className="block h-full">
                <Card className="group h-full cursor-pointer overflow-hidden hover:-translate-y-1">
                  <div className={`h-1.5 w-full bg-gradient-to-r ${COVER_COLORS[p.cover_color] ?? COVER_COLORS.violet}`} />
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="grid size-11 place-items-center rounded-xl border border-border bg-secondary/50 text-xl shrink-0">
                        {tpl?.emoji ?? "✨"}
                      </div>
                      <span className="font-mono text-[10px] text-muted-foreground tabular-nums pt-1">{relativeTime(p.updated_at)}</span>
                    </div>
                    <div className="label-mono text-[0.6rem] mt-3">{tpl?.name ?? "مشروع"}</div>
                    <h3 className="font-semibold text-[15px] line-clamp-1 mt-0.5 group-hover:text-primary transition-colors">
                      {p.name}
                    </h3>
                    {p.brief && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                        {p.brief}
                      </p>
                    )}
                  </div>
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
