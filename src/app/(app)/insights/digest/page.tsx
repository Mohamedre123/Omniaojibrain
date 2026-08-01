"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { listLibrary } from "@/lib/media-library";
import { Loader2, Newspaper, FileText, ImageIcon, FolderKanban } from "lucide-react";

type Deliverable = { kind: string; title: string; created_at: string };
type Proj = { name: string; updated_at: string };

const KIND_LABEL: Record<string, string> = {
  note: "نصوص", strategy: "استراتيجيات", landing_page: "صفحات هبوط", faq: "أسئلة شائعة",
};

export default function DigestPage() {
  const [loading, setLoading] = useState(true);
  const [dels, setDels] = useState<Deliverable[]>([]);
  const [projects, setProjects] = useState<Proj[]>([]);
  const [mediaCount, setMediaCount] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const [{ data: d }, { data: p }] = await Promise.all([
        supabase.from("deliverables").select("kind, title, created_at").eq("user_id", user.id).gte("created_at", weekAgo).order("created_at", { ascending: false }),
        supabase.from("projects").select("name, updated_at").eq("user_id", user.id).gte("updated_at", weekAgo).order("updated_at", { ascending: false }),
      ]);
      setDels((d as Deliverable[]) || []);
      setProjects((p as Proj[]) || []);
      try { const lib = await listLibrary(); setMediaCount(lib.length); } catch { setMediaCount(null); }
      setLoading(false);
    })();
  }, []);

  const byKind = dels.reduce<Record<string, number>>((acc, d) => { acc[d.kind] = (acc[d.kind] || 0) + 1; return acc; }, {});

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2"><Newspaper className="size-7 text-primary" /> الموجز الأسبوعي</h1>
        <p className="text-muted-foreground mt-1 text-sm">كل اللي أنجزته في آخر 7 أيام في مكان واحد.</p>
      </div>

      {loading ? (
        <div className="grid place-items-center py-16"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
            <Stat icon={<FileText className="size-5" />} value={dels.length} label="محتوى ومخرجات" />
            <Stat icon={<FolderKanban className="size-5" />} value={projects.length} label="مشاريع محدّثة" />
            <Stat icon={<ImageIcon className="size-5" />} value={mediaCount ?? "—"} label="ملفات في المكتبة" href="/studio/library" />
          </div>

          {dels.length === 0 && projects.length === 0 ? (
            <Card className="p-10 text-center text-sm text-muted-foreground">
              مفيش نشاط في آخر 7 أيام لسه — ابدأ من <Link href="/tools" className="text-primary underline">دليل الأدوات</Link> أو اسأل <Link href="/insights/today" className="text-primary underline">«أعمل إيه النهارده؟»</Link>.
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {dels.length > 0 && (
                <Card className="p-5">
                  <h3 className="font-semibold text-sm mb-3">المخرجات حسب النوع</h3>
                  <div className="space-y-2">
                    {Object.entries(byKind).map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{KIND_LABEL[k] || k}</span>
                        <span className="font-bold">{v}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 border-t pt-3 space-y-1.5 max-h-40 overflow-y-auto">
                    {dels.slice(0, 8).map((d, i) => <div key={i} className="text-xs text-muted-foreground truncate">• {d.title}</div>)}
                  </div>
                </Card>
              )}
              {projects.length > 0 && (
                <Card className="p-5">
                  <h3 className="font-semibold text-sm mb-3">مشاريع اشتغلت عليها</h3>
                  <div className="space-y-1.5">
                    {projects.slice(0, 10).map((p, i) => <div key={i} className="text-sm truncate">📂 {p.name}</div>)}
                  </div>
                </Card>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Stat({ icon, value, label, href }: { icon: React.ReactNode; value: number | string; label: string; href?: string }) {
  const inner = (
    <Card className="p-4 text-center h-full">
      <div className="mx-auto size-10 rounded-xl bg-primary/10 text-primary grid place-items-center mb-2">{icon}</div>
      <div className="text-2xl font-extrabold">{value}</div>
      <div className="text-[11px] text-muted-foreground mt-0.5">{label}</div>
    </Card>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}
