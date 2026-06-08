"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Search, Loader2, Sparkles, Copy, Save, Wand2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { createClient } from "@/lib/supabase/client";

type Project = { id: string; name: string; brief: string | null; business_type: string };

export default function CompetitorAnalysisPage() {
  const [projectId, setProjectId] = useState<string>("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [niche, setNiche] = useState("");
  const [location, setLocation] = useState("");
  const [knownCompetitors, setKnownCompetitors] = useState("");
  const [autoSearch, setAutoSearch] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("projects")
        .select("id, name, brief, business_type")
        .order("updated_at", { ascending: false });
      setProjects((data as Project[]) || []);
    })();
  }, []);

  function autoFillFromProject(projId: string) {
    setProjectId(projId);
    const p = projects.find((x) => x.id === projId);
    if (p) {
      if (!niche && p.brief) setNiche(p.brief.slice(0, 100));
    }
  }

  async function analyze() {
    if (!autoSearch && !knownCompetitors.trim()) {
      toast.error("اكتب المنافسين أو فعّل البحث التلقائي");
      return;
    }
    if (autoSearch && !niche.trim()) {
      toast.error("اكتب المجال/الـ Niche لكي يبحث Oji");
      return;
    }

    const input = autoSearch
      ? `**المهمّة**: ابحث وحلّل أبرز 3-5 منافسين في المجال التالي بناءً على معرفتك العامّة وسياق المشروع.

**المجال/الـ Niche**: ${niche}
${location ? `**المنطقة**: ${location}` : ""}

**خطواتك**:
1. اقترح أبرز المنافسين المعروفين في هذا المجال (وفّر أسماء حقيقية متى أمكن).
2. لكلّ منافس، قدّم تحليلاً يشمل:
   - الوضع التسويقي | هوية العلامة | استراتيجية المحتوى
   - نقاط القوّة | نقاط الضعف
3. في النهاية، قدّم **استراتيجية تفوّق** للعميل في 5 نقاط محدّدة.

⚠️ مهمّ: لا تطلب من العميل أن يبحث بنفسه. أنت من تبحث وتقترح.`
      : `**المنافسون المحدّدون**:
${knownCompetitors}

حلّل كلَّ واحدٍ منهم بالتفصيل، ثم قدّم استراتيجية تفوّق.`;

    setLoading(true);
    setResult("");

    try {
      const res = await fetch("/api/generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: "competitor_research",
          input,
          project_id: projectId || undefined,
        }),
      });

      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({ error: "حدثت مشكلة" }));
        toast.error(err.error ?? "حدثت مشكلة");
        setLoading(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setResult(acc);
      }
    } catch {
      toast.error("تعذّر الاتصال");
    } finally {
      setLoading(false);
    }
  }

  function copy() {
    navigator.clipboard.writeText(result);
    toast.success("تمّ النسخ");
  }

  async function save() {
    if (!projectId) { toast.error("اختر مشروعاً للحفظ"); return; }
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("deliverables").insert({
      project_id: projectId,
      user_id: user.id,
      kind: "competitor_analysis",
      title: `تحليل منافسين — ${new Date().toLocaleDateString("ar")}`,
      content: result,
    });
    toast.success("اتحفظ في المكتبة 📚");
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Search className="size-7 text-primary" />
          تحليل المنافسين الذكي
        </h1>
        <p className="text-muted-foreground mt-2">
          Oji يبحث عن منافسيك تلقائياً ويقدّم خطّة للتفوّق عليهم
        </p>
      </div>

      <Card className="p-5 space-y-4 mb-6">
        {projects.length > 0 && (
          <div>
            <Label htmlFor="proj">المشروع</Label>
            <select
              id="proj"
              value={projectId}
              onChange={(e) => autoFillFromProject(e.target.value)}
              className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
            >
              <option value="">— بدون مشروع —</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        )}

        <Card className="p-3 bg-primary/5 border-primary/30">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={autoSearch}
              onChange={(e) => setAutoSearch(e.target.checked)}
              className="size-4 mt-0.5"
            />
            <div>
              <div className="font-medium text-sm flex items-center gap-2">
                <Wand2 className="size-4 text-primary" />
                Oji يبحث عن المنافسين تلقائياً
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                اكتب مجالك فقط، و Oji يقترح ويحلّل المنافسين بنفسه
              </p>
            </div>
          </label>
        </Card>

        {autoSearch ? (
          <>
            <div>
              <Label htmlFor="niche">المجال / الـ Niche *</Label>
              <Input
                id="niche"
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                placeholder="مثلاً: مطاعم برجر في مصر، تطبيقات تعلم لغات، براندات ملابس محجبات..."
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="loc">المنطقة الجغرافية (اختياري)</Label>
              <Input id="loc" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="القاهرة / السعودية / الخليج" className="mt-1" />
            </div>
          </>
        ) : (
          <div>
            <Label htmlFor="comps">المنافسون المعروفون</Label>
            <Textarea
              id="comps"
              value={knownCompetitors}
              onChange={(e) => setKnownCompetitors(e.target.value)}
              rows={5}
              placeholder="اكتب أسماء أو روابط منافسيك (واحد لكل سطر)"
              className="mt-1"
            />
          </div>
        )}

        <Button onClick={analyze} disabled={loading} variant="gradient" size="lg" className="w-full">
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          {loading ? "Oji يحلّل المنافسين..." : "بدء التحليل"}
        </Button>
      </Card>

      {result && (
        <Card className="p-5">
          <div className="flex items-center justify-between border-b pb-3 mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Sparkles className="size-5 text-primary" /> نتيجة التحليل
            </h3>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" onClick={copy}><Copy className="size-3" /> نسخ</Button>
              {projectId && <Button variant="gradient" size="sm" onClick={save}><Save className="size-3" /> حفظ</Button>}
            </div>
          </div>
          <div className="prose prose-sm dark:prose-invert max-w-none max-h-[600px] overflow-y-auto">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{result}</ReactMarkdown>
          </div>
        </Card>
      )}
    </div>
  );
}
