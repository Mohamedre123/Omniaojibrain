"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { CheckSquare, Loader2, Plus, Trash2, Check } from "lucide-react";

type Task = { id: string; title: string; done: boolean };

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [needsTable, setNeedsTable] = useState(false);

  async function load() {
    const supabase = createClient();
    const { data, error } = await supabase.from("tasks").select("*").order("created_at", { ascending: false });
    if (error) { setNeedsTable(true); setLoading(false); return; }
    setTasks((data as Task[]) || []);
    setLoading(false);
  }
  useEffect(() => { void load(); }, []);

  async function add() {
    const t = title.trim();
    if (!t) return;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase.from("tasks").insert({ user_id: user.id, title: t }).select().single();
    if (error) { toast.error("تعذّر"); return; }
    setTasks((p) => [data as Task, ...p]);
    setTitle("");
  }
  async function toggle(task: Task) {
    const supabase = createClient();
    await supabase.from("tasks").update({ done: !task.done }).eq("id", task.id);
    setTasks((p) => p.map((x) => (x.id === task.id ? { ...x, done: !x.done } : x)));
  }
  async function remove(task: Task) {
    const supabase = createClient();
    await supabase.from("tasks").delete().eq("id", task.id);
    setTasks((p) => p.filter((x) => x.id !== task.id));
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2"><CheckSquare className="size-7 text-primary" /> مهامي</h1>
        <p className="text-muted-foreground mt-1 text-sm">نظّم شغلك وتابع مهامك في مكان واحد.</p>
      </div>

      {needsTable ? (
        <Card className="p-5 text-sm">⚠️ الميزة تحتاج تفعيلاً: شغّل كود جدول <code>tasks</code> في Supabase مرة واحدة، ثم حدّث الصفحة.</Card>
      ) : (
        <>
          <div className="flex gap-2 mb-4">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") add(); }} placeholder="أضف مهمة جديدة..." />
            <Button onClick={add} variant="gradient" className="shrink-0"><Plus className="size-4" /> إضافة</Button>
          </div>
          {loading ? (
            <div className="grid place-items-center py-10"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
          ) : tasks.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">مفيش مهام. أضف أول مهمة.</p>
          ) : (
            <div className="space-y-2">
              {tasks.map((t) => (
                <Card key={t.id} className="p-3 flex items-center gap-3">
                  <button onClick={() => toggle(t)} className={`size-6 rounded-md border grid place-items-center shrink-0 ${t.done ? "bg-primary border-primary text-white" : ""}`}>
                    {t.done && <Check className="size-4" />}
                  </button>
                  <span className={`flex-1 text-sm ${t.done ? "line-through text-muted-foreground" : ""}`}>{t.title}</span>
                  <button onClick={() => remove(t)} className="text-destructive shrink-0"><Trash2 className="size-4" /></button>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
