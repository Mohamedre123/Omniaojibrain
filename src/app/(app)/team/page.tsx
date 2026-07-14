"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { Users, Loader2, UserPlus, Trash2, Shield } from "lucide-react";

type Member = { id: string; member_email: string; role: string; created_at: string };

const ROLES: Record<string, string> = { admin: "مدير", editor: "محرّر", viewer: "مشاهد" };

export default function TeamPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("editor");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [needsTable, setNeedsTable] = useState(false);

  async function load() {
    const supabase = createClient();
    const { data, error } = await supabase.from("team_members").select("*").order("created_at", { ascending: false });
    if (error) { setNeedsTable(true); setLoading(false); return; }
    setMembers((data as Member[]) || []);
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  async function invite() {
    const target = email.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(target)) { toast.error("اكتب بريداً صحيحاً"); return; }
    setAdding(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      if (target === user.email?.toLowerCase()) { toast.error("ده بريدك أنت"); return; }
      const { error } = await supabase.from("team_members").insert({ owner_id: user.id, member_email: target, role });
      if (error) { toast.error("تعذّر الإضافة", { description: error.message }); return; }
      toast.success("اتضاف العضو ✓");
      setEmail("");
      void load();
    } finally {
      setAdding(false);
    }
  }

  async function remove(m: Member) {
    const supabase = createClient();
    const { error } = await supabase.from("team_members").delete().eq("id", m.id);
    if (error) { toast.error("تعذّر الحذف"); return; }
    setMembers((prev) => prev.filter((x) => x.id !== m.id));
    toast.success("اتحذف");
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2"><Users className="size-7 text-primary" /> الفريق</h1>
        <p className="text-muted-foreground mt-1 text-sm">أضف أعضاء فريقك بأدوارٍ مختلفة لإدارة حسابك ومشاريعك.</p>
      </div>

      {needsTable ? (
        <Card className="p-5 text-sm">
          ⚠️ الميزة تحتاج تفعيلاً: شغّل كود جدول <code>team_members</code> في Supabase مرة واحدة، ثم حدّث الصفحة.
        </Card>
      ) : (
        <>
          <Card className="p-5 mb-5">
            <Label>دعوة عضو جديد</Label>
            <div className="mt-2 flex flex-col sm:flex-row gap-2">
              <Input type="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="بريد العضو الإلكتروني" className="flex-1" />
              <select value={role} onChange={(e) => setRole(e.target.value)} className="h-10 px-3 rounded-md border border-input bg-background text-sm">
                <option value="admin">مدير</option>
                <option value="editor">محرّر</option>
                <option value="viewer">مشاهد</option>
              </select>
              <Button onClick={invite} disabled={adding || !email.trim()} variant="gradient" className="shrink-0">
                {adding ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />} إضافة
              </Button>
            </div>
          </Card>

          {loading ? (
            <div className="grid place-items-center py-10"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
          ) : members.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">لسه مفيش أعضاء. أضف أول عضو في فريقك.</p>
          ) : (
            <div className="space-y-2">
              {members.map((m) => (
                <Card key={m.id} className="p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-10 rounded-full gradient-brand text-white grid place-items-center font-bold shrink-0">{m.member_email[0]?.toUpperCase()}</div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate" dir="ltr">{m.member_email}</p>
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Shield className="size-3" /> {ROLES[m.role] || m.role}</span>
                    </div>
                  </div>
                  <Button onClick={() => remove(m)} variant="ghost" size="icon" className="text-destructive shrink-0"><Trash2 className="size-4" /></Button>
                </Card>
              ))}
            </div>
          )}

          <p className="mt-6 text-xs text-muted-foreground">💡 وصول الأعضاء الكامل لمشاريعك يُفعّل في تحديثٍ قادم — حالياً هذه إدارة الأعضاء والأدوار.</p>
        </>
      )}
    </div>
  );
}
