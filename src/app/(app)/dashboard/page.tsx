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

      {/* هيرو */}
      <div className="relative overflow-hidden rounded-[28px] gradient-brand text-white p-6 sm:p-9 mb-6 shadow-2xl shadow-primary/30">
        <span aria-hidden className="pointer-events-none absolute -top-16 -right-10 size-64 rounded-full bg-white/15 blur-3xl" />
        <span aria-hidden className="pointer-events-none absolute -bottom-24 left-1/4 size-72 rounded-full bg-black/10 blur-3xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-5">
          <div className="min-w-0">
            <div className="text-white/80 text-sm font-medium mb-1">لوحة التحكّم</div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              {firstName ? <>أهلاً {firstName} 👋</> : "أهلاً بيك 👋"}
            </h1>
            <p className="text-white/85 mt-2 max-w-lg text-sm sm:text-base">كل أدواتك ومشاريعك في مكان واحد — اختار عالمك وابدأ تصنع.</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link href="/tools" className="inline-flex items-center gap-2 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur px-4 h-11 font-semibold transition-colors">🧭 كل الأدوات</Link>
              <Link href="/assistant" className="inline-flex items-center gap-2 rounded-xl bg-white text-primary hover:bg-white/90 px-4 h-11 font-semibold transition-colors">💬 المساعد</Link>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 shrink-0">
            {[
              { k: "المشاريع", v: String(list.length) },
              { k: "الأدوات", v: "90+" },
              { k: "الحالة", v: "ONLINE" },
            ].map((s) => (
              <div key={s.k} className="rounded-2xl bg-white/12 backdrop-blur px-4 py-3 text-center min-w-[82px]">
                <div className="text-2xl font-extrabold tabular-nums">{s.v}</div>
                <div className="text-white/75 text-[11px] mt-0.5">{s.k}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* العوالم */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6">
        {WORLDS.map((w) => (
          <Link key={w.href} href={w.href} className={`group relative overflow-hidden rounded-3xl p-5 text-white min-h-[130px] flex flex-col justify-between shadow-lg hover:-translate-y-1.5 transition-transform bg-gradient-to-br ${w.grad}`}>
            <span aria-hidden className="pointer-events-none absolute -top-8 -left-8 size-28 rounded-full bg-white/20 blur-2xl group-hover:scale-125 transition-transform" />
            <div className="relative text-3xl">{w.emoji}</div>
            <div className="relative">
              <div className="font-bold text-lg leading-tight">{w.title}</div>
              <div className="text-white/85 text-xs mt-1">{w.desc}</div>
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
