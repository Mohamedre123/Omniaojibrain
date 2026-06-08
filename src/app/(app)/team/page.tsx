"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, UserPlus, Crown, Mail, Check, Copy, Info } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Project = { id: string; name: string };

export default function TeamPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState<string>("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("projects")
        .select("id, name")
        .order("updated_at", { ascending: false });
      setProjects((data as Project[]) || []);
      if (data && data.length > 0) setProjectId((data[0] as Project).id);
    })();
  }, []);

  async function generateInvite() {
    if (!projectId) { toast.error("اختر مشروعاً"); return; }
    setCreating(true);

    const supabase = createClient();

    // فعّل المشاركة بـ token جديد على المشروع
    const token = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map((b) => b.toString(16).padStart(2, "0")).join("");

    const { error } = await supabase
      .from("projects")
      .update({ share_token: token, is_shared: true })
      .eq("id", projectId);

    setCreating(false);

    if (error) { toast.error("حدثت مشكلة"); return; }

    const url = `${window.location.origin}/share/${token}`;
    setInviteLink(url);
    toast.success("تمّ توليد لينك الفريق");
  }

  function copyLink() {
    navigator.clipboard.writeText(inviteLink);
    toast.success("اتنسخ");
  }

  function shareViaEmail() {
    if (!inviteEmail.trim() || !inviteLink) { toast.error("ضيف الإيميل والّد لينك"); return; }
    const subject = encodeURIComponent("دعوة للانضمام لمشروع في Oji Brain");
    const body = encodeURIComponent(`أهلاً،\n\nأشاركك مشروعاً في Oji Brain لاستعراض المحتوى والموافقة عليه.\n\n${inviteLink}\n\nشكراً`);
    window.open(`mailto:${inviteEmail}?subject=${subject}&body=${body}`);
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Users className="size-7 text-primary" />
          الفريق والمشاركة
        </h1>
        <p className="text-muted-foreground mt-2">
          شارك مشاريعك مع فريقك أو عميلك للاطّلاع والموافقة
        </p>
      </div>

      <Card className="p-3 mb-4 bg-blue-50 dark:bg-blue-950/30 border-blue-300 flex items-start gap-2 text-sm">
        <Info className="size-4 text-blue-600 shrink-0 mt-0.5" />
        <div>
          النسخة المتاحة دلوقتي: مشاركة Read-Only للمشروع. التعاون الكامل (تعليقات، Workspace مشترك، Approval Flow) في الطريق.
        </div>
      </Card>

      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold mb-2">
          <Crown className="size-4 text-amber-500" /> أنت مالك هذا الـ Workspace
        </div>

        <div>
          <Label htmlFor="proj">اختر المشروع</Label>
          <select
            id="proj"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
          >
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        <Button onClick={generateInvite} disabled={creating || !projectId} variant="gradient" className="w-full">
          <UserPlus className="size-4" /> توليد لينك مشاركة
        </Button>

        {inviteLink && (
          <Card className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300">
            <Label className="text-emerald-800 dark:text-emerald-200 flex items-center gap-1">
              <Check className="size-3" /> اللينك جاهز
            </Label>
            <div className="flex gap-2 mt-2">
              <Input value={inviteLink} readOnly className="font-mono text-xs" />
              <Button variant="outline" size="icon" onClick={copyLink}>
                <Copy className="size-3" />
              </Button>
            </div>

            <div className="mt-3 pt-3 border-t border-emerald-300/50">
              <Label className="text-sm">أرسل عبر بريد</Label>
              <div className="flex gap-2 mt-1">
                <Input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="member@email.com" type="email" />
                <Button variant="gradient" onClick={shareViaEmail}>
                  <Mail className="size-3" /> إرسال
                </Button>
              </div>
            </div>
          </Card>
        )}
      </Card>
    </div>
  );
}
