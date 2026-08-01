"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, Loader2, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { createClient } from "@/lib/supabase/client";

type Project = { id: string; name: string };

export function DashboardToday() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data } = await supabase.from("projects").select("id, name").order("updated_at", { ascending: false });
      const list = (data as Project[]) || [];
      setProjects(list);
      if (list[0]) setProjectId(list[0].id);
    })();
  }, []);

  async function generate() {
    setLoading(true);
    setResult("");
    try {
      const res = await fetch("/api/generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool: "daily_actions", input: "اقترح مهام النهارده.", project_id: projectId || undefined }),
      });
      if (!res.ok || !res.body) { toast.error("تعذّر التوليد"); setLoading(false); return; }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let acc = "";
      while (true) { const { value, done } = await reader.read(); if (done) break; acc += dec.decode(value, { stream: true }); setResult(acc); }
    } catch { toast.error("تعذّر الاتصال"); } finally { setLoading(false); }
  }

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="size-9 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0"><Brain className="size-5" /></div>
          <div>
            <h3 className="font-semibold text-sm">أعمل إيه النهارده؟</h3>
            <p className="text-[11px] text-muted-foreground">مهام محتوى جاهزة للتنفيذ على مقاس مشروعك</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {projects.length > 0 && (
            <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="h-9 px-2 rounded-md border border-input bg-background text-xs max-w-[160px]">
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          )}
          <Button size="sm" variant="gradient" onClick={generate} disabled={loading}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            {loading ? "بيفكّر…" : "اقترحلي"}
          </Button>
        </div>
      </div>

      {result && (
        <div className="mt-4 border-t pt-4 prose prose-sm dark:prose-invert max-w-none text-sm">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{result}</ReactMarkdown>
          <div className="mt-2 not-prose">
            <Link href="/insights/today" className="text-xs text-primary hover:underline">افتح الأداة كاملة ←</Link>
          </div>
        </div>
      )}
    </Card>
  );
}
