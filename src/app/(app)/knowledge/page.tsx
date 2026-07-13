"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { BookOpen, Loader2, Save } from "lucide-react";

type Project = { id: string; name: string };

export default function KnowledgePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState("");
  const [knowledge, setKnowledge] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [needsCol, setNeedsCol] = useState(false);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data } = await supabase.from("projects").select("id, name").not("business_type", "in", "(assistant,studio)").order("updated_at", { ascending: false });
      const list = (data as Project[]) || [];
      setProjects(list);
      if (list[0]) setProjectId(list[0].id);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!projectId) return;
    (async () => {
      const supabase = createClient();
      const { data, error } = await supabase.from("projects").select("knowledge").eq("id", projectId).maybeSingle();
      if (error) { setNeedsCol(true); return; }
      setNeedsCol(false);
      setKnowledge((data?.knowledge as string) || "");
    })();
  }, [projectId]);

  async function save() {
    if (!projectId) return;
    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("projects").update({ knowledge: knowledge.trim() || null, updated_at: new Date().toISOString() }).eq("id", projectId);
      if (error) { toast.error("تعذّر الحفظ", { description: error.message }); return; }
      toast.success("اتحفظت معرفة المشروع ✓ — الـ AI هيرد بناءً عليها");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-5">
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
          <BookOpen className="size-7 text-primary" /> قاعدة المعرفة
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">اكتب أو الصق معلومات مشروعك (المنتجات، الأسعار، الأسئلة الشائعة، سياساتك…) — والـ AI هيستند إليها في كل الردود لهذا المشروع.</p>
      </div>

      {needsCol && (
        <Card className="p-4 text-sm mb-4">
          ⚠️ الميزة تحتاج تفعيلاً: شغّل <code>alter table public.projects add column if not exists knowledge text;</code> في Supabase مرة واحدة، ثم حدّث الصفحة.
        </Card>
      )}

      {loading ? (
        <div className="grid place-items-center py-10"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
      ) : projects.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-8">اعمل مشروعاً أولاً عشان تضيفله معرفة.</p>
      ) : (
        <Card className="p-5 space-y-4">
          <div>
            <Label htmlFor="proj">المشروع</Label>
            <select id="proj" value={projectId} onChange={(e) => setProjectId(e.target.value)} className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <Label htmlFor="k">معرفة المشروع</Label>
            <Textarea id="k" value={knowledge} onChange={(e) => setKnowledge(e.target.value)} rows={12} placeholder={"مثال:\n- منتجاتنا: ...\n- الأسعار: ...\n- سياسة الشحن: ...\n- الأسئلة الشائعة: ..."} className="mt-1" dir="auto" />
            <p className="text-xs text-muted-foreground mt-1">{knowledge.length} حرف — كل ما تكتب تفاصيل أكتر، ردود الـ AI تبقى أدق.</p>
          </div>
          <Button onClick={save} disabled={saving} variant="gradient" className="w-full">
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} حفظ المعرفة
          </Button>
        </Card>
      )}
    </div>
  );
}
