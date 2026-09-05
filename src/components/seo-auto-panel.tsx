"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CalendarClock, Loader2, Sparkles, Send, Globe } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Platform = "none" | "wordpress" | "webhook";
type PublishCfg = {
  platform?: Platform;
  siteUrl?: string; username?: string; appPassword?: string; status?: "publish" | "draft";
  webhookUrl?: string; authHeader?: string;
};
type ProjectOption = { id: string; name: string };
type Sub = { config: { project_id?: string; keywords?: string[]; publish?: PublishCfg } | null; enabled: boolean };

export function SeoAutoPanel() {
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [subs, setSubs] = useState<Sub[]>([]);
  const [projectId, setProjectId] = useState("");
  const [keywords, setKeywords] = useState("");
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [needsTable, setNeedsTable] = useState(false);

  // إعدادات النشر التلقائي
  const [platform, setPlatform] = useState<Platform>("none");
  const [siteUrl, setSiteUrl] = useState("");
  const [username, setUsername] = useState("");
  const [appPassword, setAppPassword] = useState("");
  const [status, setStatus] = useState<"publish" | "draft">("publish");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [authHeader, setAuthHeader] = useState("");

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

  // لو اخترت مشروع، اعرض إعداداته المحفوظة
  useEffect(() => {
    const s = subs.find((x) => x.config?.project_id === projectId);
    setKeywords(s?.config?.keywords?.join("\n") || "");
    const p = s?.config?.publish;
    setPlatform(p?.platform || "none");
    setSiteUrl(p?.siteUrl || "");
    setUsername(p?.username || "");
    setAppPassword(p?.appPassword || "");
    setStatus(p?.status || "publish");
    setWebhookUrl(p?.webhookUrl || "");
    setAuthHeader(p?.authHeader || "");
  }, [projectId, subs]);

  const activeCount = subs.filter((s) => s.enabled).length;

  function publishPayload(): PublishCfg {
    return { platform, siteUrl, username, appPassword, status, webhookUrl, authHeader };
  }

  async function testPublish() {
    if (platform === "none") { toast.error("اختر منصّة نشر الأول"); return; }
    setTesting(true);
    try {
      const res = await fetch("/api/seo/publish-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, siteUrl, username, appPassword, webhookUrl, authHeader }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(j.error || "فشل الاختبار"); return; }
      toast.success(platform === "wordpress" ? "تمام! اتنشرت مسودّة اختبار على مدونتك ✅" : "تمام! وصلت رسالة الاختبار للـ Webhook ✅");
    } catch {
      toast.error("تعذّر الاتصال");
    } finally {
      setTesting(false);
    }
  }

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
          publish: publishPayload(),
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

          {/* النشر التلقائي على موقع العميل */}
          <div className="rounded-lg border border-primary/15 bg-muted/30 p-3 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Globe className="size-4 text-primary" />
              النشر التلقائي على موقعك (اختياري)
            </div>
            <div>
              <Label htmlFor="seo-plat">المنصّة</Label>
              <select
                id="seo-plat"
                value={platform}
                onChange={(e) => setPlatform(e.target.value as Platform)}
                className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="none">حفظ في المكتبة بس (بدون نشر)</option>
                <option value="wordpress">WordPress (نشر مباشر)</option>
                <option value="webhook">أي منصّة أخرى — Webhook/API (سلة/زد/كستم)</option>
              </select>
            </div>

            {platform === "wordpress" && (
              <div className="space-y-2">
                <Input placeholder="رابط الموقع — https://yoursite.com" value={siteUrl} onChange={(e) => setSiteUrl(e.target.value)} />
                <Input placeholder="اسم المستخدم (WordPress)" value={username} onChange={(e) => setUsername(e.target.value)} />
                <Input type="password" placeholder="Application Password" value={appPassword} onChange={(e) => setAppPassword(e.target.value)} />
                <select value={status} onChange={(e) => setStatus(e.target.value as "publish" | "draft")} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                  <option value="publish">انشر مباشرة</option>
                  <option value="draft">احفظ كمسودّة (تراجعها قبل النشر)</option>
                </select>
                <p className="text-xs text-muted-foreground">
                  الـ Application Password بتعمله من: WordPress → Users → Profile → Application Passwords.
                </p>
              </div>
            )}

            {platform === "webhook" && (
              <div className="space-y-2">
                <Input placeholder="رابط الـ Webhook — https://..." value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} />
                <Input placeholder="Authorization header (اختياري) — Bearer xxxxx" value={authHeader} onChange={(e) => setAuthHeader(e.target.value)} />
                <p className="text-xs text-muted-foreground">
                  Oji هيبعت المقال JSON (<code>title</code> + <code>content_html</code> + <code>content_markdown</code>) للرابط ده. استخدمه مع سلة/زد أو Zapier/Make/n8n أو أي endpoint عندك.
                </p>
              </div>
            )}

            {platform !== "none" && (
              <Button onClick={testPublish} disabled={testing} variant="outline" size="sm" className="w-full">
                {testing ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                اختبار الربط
              </Button>
            )}
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
