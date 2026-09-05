"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CalendarClock, Loader2, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type ProjectOption = { id: string; name: string };
type Sub = { config: { project_id?: string; keywords?: string[] } | null; enabled: boolean };

export function SeoAutoPanel() {
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [subs, setSubs] = useState<Sub[]>([]);
  const [projectId, setProjectId] = useState("");
  const [keywords, setKeywords] = useState("");
  const [loading, setLoading] = useState(false);
  const [needsTable, setNeedsTable] = useState(false);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data } = await supabase.from("projects").select("id, name").order("updated_at", { ascending: false });
      setProjects((data as ProjectOption[]) || []);
      await loadSubs();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadSubs() {
    const res = await fetch("/api/seo/auto");
    const j = await res.json().catch(() => ({}));
    if (j.needs_table) setNeedsTable(true);
    setSubs(j.items || []);
  }

  // لو اخترت مشروع مفعّل، اعرض كلماته
  useEffect(() => {
    const s = subs.find((x) => x.config?.project_id === projectId && x.enabled);
    setKeywords(s?.config?.keywords?.join("\n") || "");
  }, [projectId, subs]);

  const activeCount = subs.filter((s) => s.enabled).length;

  async function save(enabled: boolean) {
    if (!projectId) { toast.error("اختر مشروعاً الأول"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/seo/auto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: projectId,
          enabled,
          keywords: keywords.split("\n").map((k) => k.trim()).filter(Boolean),
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (j.error === "needs_table") { setNeedsTable(true); toast.error("محتاج تفعيل جدول الربط الأول"); }
        else toast.error(j.error || "حصلت مشكلة");
        return;
      }
      toast.success(enabled ? "اتفعّلت الأتمتة اليومية ✅ — هيتكتب مقال كل يوم" : "اتوقفت الأتمتة لهذا المشروع");
      await loadSubs();
    } catch {
      toast.error("تعذّر الاتصال");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="p-5 space-y-4 mt-8">
      <div className="flex items-start gap-3">
        <div className="size-10 rounded-xl bg-primary/10 grid place-items-center text-primary shrink-0">
          <CalendarClock className="size-5" />
        </div>
        <div>
          <h3 className="font-semibold flex items-center gap-2">
            الأتمتة اليومية
            {activeCount > 0 && (
              <span className="text-xs bg-primary/15 text-primary px-2 py-0.5 rounded-full">
                {activeCount} مشروع مفعّل
              </span>
            )}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            فعّلها ومنصّة Oji هتكتب مقال SEO جديد لمشروعك <b>كل يوم تلقائياً</b> وتحفظه في مكتبة المشروع — من غير ما تعمل حاجة.
          </p>
        </div>
      </div>

      {needsTable ? (
        <div className="text-sm rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-amber-700 dark:text-amber-400">
          ميزة الربط محتاجة تفعيل جدول <code>oji_connectors</code> مرة واحدة في قاعدة البيانات. بعد التفعيل الأتمتة هتشتغل على طول.
        </div>
      ) : (
        <>
          <div>
            <Label htmlFor="seo-proj">المشروع</Label>
            <select
              id="seo-proj"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
            >
              <option value="">— اختر مشروع —</option>
              {projects.map((p) => {
                const on = subs.find((s) => s.config?.project_id === p.id && s.enabled);
                return <option key={p.id} value={p.id}>{p.name}{on ? " ✅" : ""}</option>;
              })}
            </select>
          </div>

          <div>
            <Label htmlFor="seo-kw">مواضيع/كلمات مفتاحية (سطر لكل موضوع — اختياري)</Label>
            <Textarea
              id="seo-kw"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              rows={4}
              placeholder={"أفضل عطور رجالي\nنصائح العناية بالبشرة\nهدايا العيد"}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              كل يوم ياخد موضوع بالترتيب. لو سِبتها فاضية، Oji هيختار موضوع مناسب لمجال مشروعك.
            </p>
          </div>

          <div className="flex gap-2">
            <Button onClick={() => save(true)} disabled={loading} variant="gradient" className="flex-1">
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              فعّل الكتابة اليومية
            </Button>
            <Button onClick={() => save(false)} disabled={loading} variant="outline">
              إيقاف
            </Button>
          </div>
        </>
      )}
    </Card>
  );
}
