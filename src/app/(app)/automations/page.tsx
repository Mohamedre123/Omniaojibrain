"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Workflow, Loader2, Sparkles, Copy, Plug } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { createClient } from "@/lib/supabase/client";

const CLAUDE_MODELS = [
  { id: "claude-opus-5", label: "Claude Opus 5 (الأقوى)" },
  { id: "claude-sonnet-5", label: "Claude Sonnet 5 (متوازن)" },
  { id: "claude-haiku-4-5", label: "Claude Haiku 4.5 (الأسرع)" },
  { id: "claude-opus-4-8", label: "Claude Opus 4.8" },
  { id: "claude-opus-4-7", label: "Claude Opus 4.7" },
  { id: "claude-opus-4-6", label: "Claude Opus 4.6" },
  { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6" },
];

const IDEAS = [
  "بوت واتساب يردّ على عملائي كموظف حقيقي 24/7",
  "وكيل انستجرام يردّ على الرسائل والتعليقات",
  "نشر بوستات تلقائي بمواعيد محدّدة",
  "أتمتة: أول ما ييجي عميل جديد، يترحّب بيه ويجمّع بياناته",
  "أتمتة تصميم: أوصف منتج → يطلّع تصميم تلقائي",
  "أتمتة فيديو: من نص → فيديو قصير جاهز",
  "ردّ آلي على الإيميلات المهمة",
  "تجميع الطلبات في Google Sheet تلقائياً",
];

type Project = { id: string; name: string };

export default function AutomationsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState("");
  const [model, setModel] = useState("claude-opus-4-8");
  const [desc, setDesc] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data } = await supabase.from("projects").select("id, name").order("updated_at", { ascending: false });
      setProjects((data as Project[]) || []);
    })();
  }, []);

  async function generate() {
    if (!desc.trim()) { toast.error("اوصف الأتمتة اللي عايزها"); return; }
    setLoading(true);
    setResult("");
    try {
      const res = await fetch("/api/generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool: "automation_designer", input: desc, project_id: projectId || undefined, provider: "claude", model }),
      });
      if (!res.ok || !res.body) { const e = await res.json().catch(() => ({})); toast.error(e.error || "تعذّر التوليد"); setLoading(false); return; }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let acc = "";
      while (true) { const { value, done } = await reader.read(); if (done) break; acc += dec.decode(value, { stream: true }); setResult(acc); }
    } catch { toast.error("تعذّر الاتصال"); } finally { setLoading(false); }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-start gap-4 mb-6">
        <div className="size-12 rounded-xl bg-primary/10 grid place-items-center text-primary shrink-0">
          <Workflow className="size-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">الأتمتة والوكلاء (Agents)</h1>
          <p className="text-muted-foreground mt-1">اوصف أي أتمتة أو وكيل عايزه — Oji يصمّملك الخطة كاملة ويقولك بالظبط تربط أنهي خدمات ومفاتيح عشان يشتغل.</p>
        </div>
      </div>

      <Card className="p-5 space-y-4">
        <div>
          <Label className="mb-2 block text-sm">أفكار جاهزة (اضغط أي واحدة)</Label>
          <div className="flex flex-wrap gap-2">
            {IDEAS.map((s) => (
              <button key={s} onClick={() => setDesc(s)} className="text-xs px-3 py-1.5 rounded-full border bg-card hover:border-primary/50 transition-colors text-right">{s}</button>
            ))}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          {projects.length > 0 && (
            <div>
              <Label className="text-xs">المشروع (لسياق نشاطك)</Label>
              <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                <option value="">— بدون —</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          )}
          <div>
            <Label className="text-xs">موديل الذكاء (Claude)</Label>
            <select value={model} onChange={(e) => setModel(e.target.value)} className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
              {CLAUDE_MODELS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
            </select>
          </div>
        </div>

        <div>
          <Label className="text-xs">اوصف الأتمتة/الوكيل</Label>
          <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={4} placeholder="مثلاً: عايز وكيل واتساب يردّ على أسئلة عملائي عن المنتجات والأسعار زي موظف حقيقي، ويحوّلني لو حد عايز يشتري." className="mt-1" />
        </div>

        <Button onClick={generate} disabled={loading} variant="gradient" size="lg" className="w-full">
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          {loading ? "بيصمّم…" : "صمّم الأتمتة"}
        </Button>
      </Card>

      {result && (
        <Card className="p-5 mt-4">
          <div className="flex items-center justify-between border-b pb-3 mb-3">
            <h3 className="font-semibold flex items-center gap-2"><Sparkles className="size-4 text-primary" /> خطة الأتمتة</h3>
            <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(result); toast.success("اتنسخت"); }}>
              <Copy className="size-3.5" /> نسخ
            </Button>
          </div>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{result}</ReactMarkdown>
          </div>
        </Card>
      )}

      <Card className="p-4 mt-4 flex items-start gap-3 bg-muted/20">
        <Plug className="size-5 text-primary shrink-0 mt-0.5" />
        <div className="text-xs text-muted-foreground leading-relaxed">
          <b className="text-foreground">جرّب دلوقتي:</b> فيه وكيل <b>تليجرام جاهز للتشغيل فوراً</b> — اربط بوتك من صفحة <Link href="/automations/connect" className="text-primary underline font-medium">ربط الخدمات</Link> وهيردّ على عملائك كموظف حقيقي. باقي الخدمات (واتساب/انستجرام…) بنفعّلها أول ما تبعت مفتاحها — وكل حاجة تفضل ملك حسابك.
        </div>
      </Card>
    </div>
  );
}
