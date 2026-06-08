"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Users, Plus, Phone, Mail, Trash2, Edit, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Lead = {
  id: string;
  name: string;
  contact: string;
  source: string;
  status: string;
  notes: string;
  created_at: string;
};

const STATUS_OPTIONS = [
  { value: "new", label: "🆕 جديد", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  { value: "contacted", label: "📞 تمّ التواصل", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
  { value: "qualified", label: "✅ مؤهّل", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
  { value: "negotiation", label: "💬 تفاوض", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" },
  { value: "won", label: "🎉 فاز", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
  { value: "lost", label: "❌ خسر", color: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300" },
];

export default function CrmPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Lead | null>(null);
  const [openDialog, setOpenDialog] = useState(false);

  useEffect(() => { void load(); }, []);

  async function load() {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    // نخزّن الـ Leads في الـ Deliverables بـ kind = 'crm_lead' + JSON في content
    const { data } = await supabase
      .from("deliverables")
      .select("*")
      .eq("kind", "crm_lead")
      .order("created_at", { ascending: false });

    const parsed: Lead[] = (data || []).map((d) => {
      try {
        const meta = JSON.parse(d.content);
        return {
          id: d.id,
          name: d.title,
          contact: meta.contact || "",
          source: meta.source || "",
          status: meta.status || "new",
          notes: meta.notes || "",
          created_at: d.created_at,
        };
      } catch {
        return null;
      }
    }).filter(Boolean) as Lead[];

    setLeads(parsed);
    setLoading(false);
  }

  function startEdit(lead?: Lead) {
    setEditing(lead || { id: "", name: "", contact: "", source: "", status: "new", notes: "", created_at: "" });
    setOpenDialog(true);
  }

  async function saveLead(form: HTMLFormElement) {
    const fd = new FormData(form);
    const name = String(fd.get("name") || "").trim();
    const contact = String(fd.get("contact") || "").trim();
    const source = String(fd.get("source") || "").trim();
    const status = String(fd.get("status") || "new").trim();
    const notes = String(fd.get("notes") || "").trim();

    if (!name) { toast.error("الاسم مطلوب"); return; }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const content = JSON.stringify({ contact, source, status, notes });

    // CRM leads ليس لها مشروع — نستخدم مشروع موجود لأي يوزر
    const { data: anyProject } = await supabase
      .from("projects")
      .select("id")
      .limit(1)
      .maybeSingle();

    if (!anyProject) {
      toast.error("أنشئ مشروعاً واحداً على الأقل لاستخدام CRM");
      return;
    }

    if (editing?.id) {
      await supabase.from("deliverables").update({ title: name, content }).eq("id", editing.id);
      toast.success("تمّ التحديث");
    } else {
      await supabase.from("deliverables").insert({
        project_id: anyProject.id,
        user_id: user.id,
        kind: "crm_lead",
        title: name,
        content,
      });
      toast.success("اتضاف Lead جديد");
    }

    setOpenDialog(false);
    setEditing(null);
    await load();
  }

  async function remove(id: string) {
    if (!confirm("متأكد من الحذف؟")) return;
    const supabase = createClient();
    await supabase.from("deliverables").delete().eq("id", id);
    toast.success("تمّ الحذف");
    await load();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="size-7 text-primary" />
            CRM بسيط
          </h1>
          <p className="text-muted-foreground mt-2">تابع Leads وعملاءك في مكان واحد</p>
        </div>
        <Button variant="gradient" onClick={() => startEdit()}>
          <Plus className="size-4" /> Lead جديد
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <Loader2 className="size-8 animate-spin mx-auto text-primary" />
        </div>
      ) : leads.length === 0 ? (
        <Card className="p-10 text-center">
          <Users className="size-12 mx-auto text-muted-foreground mb-3" />
          <h3 className="font-semibold">لا توجد Leads بعد</h3>
          <p className="text-sm text-muted-foreground mt-1">اضغط "Lead جديد" لإضافة أوّل عميل محتمل</p>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {leads.map((lead) => {
            const st = STATUS_OPTIONS.find((s) => s.value === lead.status) || STATUS_OPTIONS[0];
            return (
              <Card key={lead.id} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold">{lead.name}</h3>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${st.color}`}>
                    {st.label}
                  </span>
                </div>
                {lead.contact && (
                  <div className="text-sm text-muted-foreground flex items-center gap-1 mb-1">
                    {lead.contact.includes("@") ? <Mail className="size-3" /> : <Phone className="size-3" />}
                    {lead.contact}
                  </div>
                )}
                {lead.source && (
                  <div className="text-xs text-muted-foreground">من: {lead.source}</div>
                )}
                {lead.notes && (
                  <p className="text-xs mt-2 line-clamp-2 text-muted-foreground">{lead.notes}</p>
                )}
                <div className="flex gap-1 mt-3 pt-3 border-t">
                  <Button variant="ghost" size="sm" onClick={() => startEdit(lead)} className="flex-1">
                    <Edit className="size-3" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => remove(lead.id)} className="flex-1 text-destructive">
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing?.id ? "تعديل" : "Lead جديد"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); saveLead(e.currentTarget); }} className="space-y-3">
            <div>
              <Label htmlFor="name">الاسم *</Label>
              <Input id="name" name="name" defaultValue={editing?.name} required />
            </div>
            <div>
              <Label htmlFor="contact">التواصل (إيميل/تليفون)</Label>
              <Input id="contact" name="contact" defaultValue={editing?.contact} />
            </div>
            <div>
              <Label htmlFor="source">المصدر</Label>
              <Input id="source" name="source" defaultValue={editing?.source} placeholder="إنستجرام / إحالة / موقع" />
            </div>
            <div>
              <Label htmlFor="status">الحالة</Label>
              <select id="status" name="status" defaultValue={editing?.status || "new"} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <Label htmlFor="notes">ملاحظات</Label>
              <Textarea id="notes" name="notes" defaultValue={editing?.notes} rows={3} />
            </div>
            <div className="flex justify-end gap-2 pt-3">
              <Button type="button" variant="outline" onClick={() => setOpenDialog(false)}>إلغاء</Button>
              <Button type="submit" variant="gradient">حفظ</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
