"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { Plug, Loader2, Trash2, Check, ArrowLeft, Send } from "lucide-react";

type Project = { id: string; name: string };
type Connector = { id: string; service: string; config: { bot_username?: string; project_id?: string | null }; enabled: boolean };

const SQL = `create table if not exists oji_connectors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  service text not null,
  secret text unique not null,
  config jsonb not null default '{}',
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);
alter table oji_connectors enable row level security;
create policy "own connectors" on oji_connectors
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);`;

export default function ConnectPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [needsTable, setNeedsTable] = useState(false);
  const [token, setToken] = useState("");
  const [projectId, setProjectId] = useState("");
  const [persona, setPersona] = useState("");
  const [connecting, setConnecting] = useState(false);

  async function load() {
    const supabase = createClient();
    const { data: projs } = await supabase.from("projects").select("id, name").order("updated_at", { ascending: false });
    setProjects((projs as Project[]) || []);
    const { data: conns, error } = await supabase.from("oji_connectors").select("id, service, config, enabled").order("created_at", { ascending: false });
    if (error && /oji_connectors|does not exist/i.test(error.message)) { setNeedsTable(true); return; }
    setConnectors((conns as Connector[]) || []);
  }
  useEffect(() => { void load(); }, []);

  async function connectTelegram() {
    if (!token.trim()) { toast.error("الصق توكن البوت"); return; }
    setConnecting(true);
    try {
      const res = await fetch("/api/automations/telegram/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token.trim(), project_id: projectId || undefined, persona: persona.trim() || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.error === "needs_table") { setNeedsTable(true); return; }
      if (!res.ok) { toast.error(data.error || "تعذّر الربط"); return; }
      toast.success(`اتربط بوت @${data.bot_username} ✅ — كلّمه على تليجرام وهيردّ`);
      setToken(""); setPersona("");
      void load();
    } catch { toast.error("تعذّر الاتصال"); } finally { setConnecting(false); }
  }

  async function remove(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("oji_connectors").delete().eq("id", id);
    if (error) { toast.error("تعذّر الحذف"); return; }
    setConnectors((p) => p.filter((c) => c.id !== id));
    toast.success("اتفصل");
  }

  if (needsTable) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-2xl font-bold mb-3">ربط الخدمات</h1>
        <Card className="p-5 space-y-3 text-sm">
          <p className="font-semibold">⚠️ تفعيل بسيط لمرّة واحدة</p>
          <p className="text-muted-foreground">شغّل كود SQL ده في Supabase (SQL Editor) مرّة واحدة، ثم حدّث الصفحة:</p>
          <pre className="text-[11px] bg-muted/50 p-3 rounded-md overflow-x-auto" dir="ltr">{SQL}</pre>
        </Card>
      </div>
    );
  }

  const telegramBots = connectors.filter((c) => c.service === "telegram");

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2"><Plug className="size-7 text-primary" /> ربط الخدمات</h1>
          <p className="text-muted-foreground mt-1 text-sm">اربط خدماتك بحسابك عشان الوكلاء والأتمتة يشتغلوا فعلاً. كل حاجة تفضل ملك حسابك.</p>
        </div>
        <Link href="/automations" className="text-sm text-muted-foreground hover:text-primary shrink-0 inline-flex items-center gap-1"><ArrowLeft className="size-4" /> الأتمتة</Link>
      </div>

      {/* تليجرام — شغّال للتجربة فوراً */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Send className="size-5 text-sky-500" />
          <h2 className="font-semibold">وكيل تليجرام <span className="text-[10px] rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2 py-0.5">جاهز للتجربة</span></h2>
        </div>
        <div className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-3 leading-relaxed">
          <b>الخطوات:</b> افتح <b>@BotFather</b> في تليجرام → <code>/newbot</code> → اختر اسم → هيديك <b>توكن</b> → الصقه تحت.
        </div>
        <div>
          <Label className="text-xs">توكن البوت (من @BotFather)</Label>
          <Input value={token} onChange={(e) => setToken(e.target.value)} placeholder="123456:ABC-DEF..." dir="ltr" className="mt-1" />
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">المشروع (معرفته ومنتجاته)</Label>
            <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
              <option value="">— بدون —</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <Label className="text-xs">شخصية الوكيل (اختياري)</Label>
            <Input value={persona} onChange={(e) => setPersona(e.target.value)} placeholder="مثلاً: موظف مبيعات ودود لمتجر عطور" className="mt-1" />
          </div>
        </div>
        <Button onClick={connectTelegram} disabled={connecting || !token.trim()} variant="gradient">
          {connecting ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />} اربط وشغّل الوكيل
        </Button>

        {telegramBots.length > 0 && (
          <div className="border-t pt-3 space-y-2">
            <p className="text-xs font-medium">البوتات المربوطة:</p>
            {telegramBots.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-lg border p-2.5 text-sm">
                <span>🤖 @{c.config.bot_username || "bot"} {c.config.project_id ? "· مربوط بمشروع" : ""}</span>
                <button onClick={() => remove(c.id)} className="text-destructive"><Trash2 className="size-4" /></button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* خدمات تانية — قريباً/بالطلب */}
      <Card className="p-5 mt-4">
        <h2 className="font-semibold text-sm mb-2">خدمات تانية</h2>
        <div className="grid sm:grid-cols-2 gap-2 text-sm">
          {["واتساب (Meta / مزوّد)", "انستجرام (Meta)", "Slack / Discord", "بريد إلكتروني", "Google Sheets", "n8n متقدّم"].map((s) => (
            <div key={s} className="flex items-center justify-between rounded-lg border p-2.5 text-muted-foreground">
              <span>{s}</span>
              <span className="text-[10px] rounded-full bg-muted px-2 py-0.5">بالطلب</span>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground mt-3">عايز نفعّل خدمة منهم؟ صمّم الأتمتة من <Link href="/automations" className="text-primary underline">صفحة الأتمتة</Link> وابعتلنا مفتاح الخدمة، ونوصّلها.</p>
      </Card>
    </div>
  );
}
