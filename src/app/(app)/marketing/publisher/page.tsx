"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import {
  Share2, Copy, ExternalLink, Info, MessageCircle, Twitter, Facebook, Linkedin,
  Calendar, Send, Upload, X, Loader2, Plug, Check, GraduationCap,
} from "lucide-react";

type Img = { path: string; url: string; previewUrl: string };
type ApiPlatform = "facebook" | "instagram" | "telegram" | "linkedin";
const API_PLATFORMS: { id: ApiPlatform; label: string; targetLabel: string; targetPlaceholder: string }[] = [
  { id: "facebook", label: "فيسبوك (صفحة)", targetLabel: "Page ID", targetPlaceholder: "123456789" },
  { id: "instagram", label: "انستجرام (Business)", targetLabel: "Instagram User ID", targetPlaceholder: "178414..." },
  { id: "telegram", label: "تليجرام (قناة)", targetLabel: "معرّف القناة", targetPlaceholder: "@mychannel" },
  { id: "linkedin", label: "لينكدإن", targetLabel: "Author URN", targetPlaceholder: "urn:li:person:xxxx" },
];

export default function PublisherPage() {
  const [text, setText] = useState("");
  const [images, setImages] = useState<Img[]>([]);
  const [uploading, setUploading] = useState(false);

  // ربط بالـ API
  const [platform, setPlatform] = useState<ApiPlatform>("facebook");
  const [token, setToken] = useState("");
  const [target, setTarget] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState<string[]>([]); // ["facebook", ...]
  const [publishingTo, setPublishingTo] = useState("");
  const [needsTable, setNeedsTable] = useState(false);
  // الجدولة
  const [schedulePlatform, setSchedulePlatform] = useState<ApiPlatform>("facebook");
  const [scheduleAt, setScheduleAt] = useState("");
  const [scheduling, setScheduling] = useState(false);
  const [scheduled, setScheduled] = useState<{ id: string; platform: string; publish_at: string; status: string }[]>([]);

  async function loadConnectors() {
    const supabase = createClient();
    const { data, error } = await supabase.from("oji_connectors").select("service").like("service", "publish:%");
    if (error) { if (/oji_connectors|does not exist/i.test(error.message)) setNeedsTable(true); return; }
    setConnected(((data as { service: string }[]) || []).map((c) => c.service.replace("publish:", "")));
  }
  async function loadScheduled() {
    const supabase = createClient();
    const { data } = await supabase.from("scheduled_posts").select("id, platform, publish_at, status").order("publish_at", { ascending: true }).limit(20);
    setScheduled((data as { id: string; platform: string; publish_at: string; status: string }[]) || []);
  }
  useEffect(() => { void loadConnectors(); void loadScheduled(); }, []);

  async function schedulePost() {
    if (!scheduleAt) { toast.error("اختر وقت النشر"); return; }
    if (!connected.includes(schedulePlatform)) { toast.error("اربط المنصّة دي بالـ API الأول"); return; }
    if (!text.trim() && images.length === 0) { toast.error("اكتب نصّ أو ارفع صورة"); return; }
    setScheduling(true);
    try {
      const res = await fetch("/api/publish/schedule", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform: schedulePlatform, text, image_paths: images.map((i) => i.path), publish_at: new Date(scheduleAt).toISOString() }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.error === "needs_table") { setNeedsTable(true); return; }
      if (!res.ok) { toast.error(data.error || "تعذّرت الجدولة"); return; }
      toast.success("اتجدول المنشور ✅");
      setScheduleAt("");
      void loadScheduled();
    } catch { toast.error("تعذّر الاتصال"); } finally { setScheduling(false); }
  }
  async function cancelScheduled(id: string) {
    const supabase = createClient();
    await supabase.from("scheduled_posts").delete().eq("id", id);
    setScheduled((p) => p.filter((x) => x.id !== id));
    toast.success("اتلغت الجدولة");
  }

  const firstUrl = images[0]?.url || "";

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error("سجّل الدخول أولاً"); return; }
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;
        if (file.size > 8 * 1024 * 1024) { toast.error(`${file.name} أكبر من 8MB`); continue; }
        const path = `${user.id}/publish/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${file.type.split("/")[1] || "jpg"}`;
        const { error } = await supabase.storage.from("uploads").upload(path, file, { contentType: file.type, upsert: true });
        if (error) { toast.error("تعذّر رفع الصورة", { description: error.message }); continue; }
        const { data: signed } = await supabase.storage.from("uploads").createSignedUrl(path, 60 * 60 * 24);
        if (signed?.signedUrl) setImages((p) => [...p, { path, url: signed.signedUrl, previewUrl: URL.createObjectURL(file) }]);
      }
    } finally { setUploading(false); }
  }

  function removeImage(path: string) { setImages((p) => p.filter((x) => x.path !== path)); }

  // ——— النشر السريع (بدون API) ———
  function open(url: string) { window.open(url, "_blank"); }
  function whatsappShare() { if (!text.trim()) return toast.error("اكتب النصّ"); open(`https://wa.me/?text=${encodeURIComponent(text)}`); }
  function twitterShare() { if (!text.trim()) return toast.error("اكتب النصّ"); open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`); }
  function facebookShare() { open(firstUrl ? `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(firstUrl)}&quote=${encodeURIComponent(text)}` : `https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(text)}`); }
  function linkedinShare() { open(firstUrl ? `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(firstUrl)}` : `https://www.linkedin.com/feed/?shareActive&mini=true&text=${encodeURIComponent(text)}`); }
  function telegramShare() { if (!text.trim()) return toast.error("اكتب النصّ"); open(`https://t.me/share/url?url=${encodeURIComponent(firstUrl || text)}&text=${encodeURIComponent(text)}`); }
  function copyOpen(url: string, msg: string) { if (!text.trim()) return toast.error("اكتب النصّ"); navigator.clipboard.writeText(text); toast.success(msg); open(url); }

  // ——— الربط والنشر بالـ API ———
  async function connect() {
    if (!token.trim()) { toast.error("الصق التوكن"); return; }
    setConnecting(true);
    try {
      const res = await fetch("/api/publish/connect", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, token: token.trim(), target: target.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.error === "needs_table") { setNeedsTable(true); return; }
      if (!res.ok) { toast.error(data.error || "تعذّر الربط"); return; }
      toast.success("اتربطت المنصّة ✅ — تقدر تنشر عليها دلوقتي");
      setToken(""); setTarget("");
      void loadConnectors();
    } catch { toast.error("تعذّر الاتصال"); } finally { setConnecting(false); }
  }

  async function publishTo(p: ApiPlatform) {
    if (!text.trim() && images.length === 0) { toast.error("اكتب نصّ أو ارفع صورة"); return; }
    setPublishingTo(p);
    try {
      const res = await fetch("/api/publish", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform: p, text, images: images.map((i) => i.url) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(data.error || "فشل النشر"); return; }
      toast.success(`اتنشر على ${p} 🎉`);
    } catch { toast.error("تعذّر الاتصال"); } finally { setPublishingTo(""); }
  }

  const currentPlatform = API_PLATFORMS.find((x) => x.id === platform)!;

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2"><Share2 className="size-7 text-primary" /> النشر المباشر</h1>
          <p className="text-muted-foreground mt-2">انشر بنقرة، أو اربط منصّتك بالـ API وانشر عليها تلقائياً من عندنا.</p>
        </div>
        <Link href="/learn/publishing" className="text-sm text-primary hover:underline shrink-0 inline-flex items-center gap-1"><GraduationCap className="size-4" /> شرح النشر</Link>
      </div>

      <Card className="p-5 space-y-4">
        <div>
          <Label htmlFor="text">نصّ المنشور</Label>
          <Textarea id="text" value={text} onChange={(e) => setText(e.target.value)} rows={6} placeholder="اكتب نصّك هنا..." className="mt-1" />
          <div className="text-xs text-muted-foreground mt-1">{text.length} حرف</div>
        </div>

        {/* رفع الصور من الجهاز */}
        <div>
          <Label>صور المنشور (من جهازك — أي عدد)</Label>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {images.map((img) => (
              <div key={img.path} className="relative size-20 rounded-lg overflow-hidden border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.previewUrl} alt="" className="w-full h-full object-cover" />
                <button onClick={() => removeImage(img.path)} className="absolute top-1 right-1 size-5 rounded-full bg-destructive text-white grid place-items-center"><X className="size-3" /></button>
              </div>
            ))}
            <label className={`size-20 rounded-lg border-2 border-dashed grid place-items-center cursor-pointer hover:border-primary ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
              <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleUpload(e.target.files)} />
              {uploading ? <Loader2 className="size-5 animate-spin text-muted-foreground" /> : <Upload className="size-5 text-muted-foreground" />}
            </label>
          </div>
        </div>

        {/* النشر السريع */}
        <div className="border-t pt-4">
          <p className="text-sm font-semibold mb-2 flex items-center gap-2"><Send className="size-4 text-primary" /> نشر سريع (بدون ربط)</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <Button onClick={whatsappShare} className="bg-green-600 hover:bg-green-700 text-white"><MessageCircle className="size-4" /> WhatsApp</Button>
            <Button onClick={twitterShare} className="bg-black text-white hover:bg-black/80"><Twitter className="size-4" /> X (Twitter)</Button>
            <Button onClick={facebookShare} className="bg-[#1877f2] hover:bg-[#1565c5] text-white"><Facebook className="size-4" /> Facebook</Button>
            <Button onClick={linkedinShare} className="bg-[#0077b5] hover:bg-[#005f8f] text-white"><Linkedin className="size-4" /> LinkedIn</Button>
            <Button onClick={telegramShare} className="bg-[#229ED9] hover:bg-[#1a7fb8] text-white"><Send className="size-4" /> Telegram</Button>
            <Button onClick={() => copyOpen("https://www.instagram.com", "اتنسخ! افتح إنستجرام والصق")} variant="outline"><Copy className="size-4" /> Instagram</Button>
            <Button onClick={() => copyOpen("https://www.tiktok.com/upload", "اتنسخ! افتح TikTok والصق")} variant="outline"><Copy className="size-4" /> TikTok</Button>
          </div>
        </div>

        {/* الربط والنشر بالـ API */}
        <div className="border-t pt-4">
          <p className="text-sm font-semibold mb-1 flex items-center gap-2"><Plug className="size-4 text-primary" /> نشر تلقائي بالـ API (ربط مرّة واحدة)</p>
          <p className="text-xs text-muted-foreground mb-3">جيب توكن من حسابك على المنصّة (<Link href="/learn/publishing" className="text-primary underline">الشرح هنا</Link>)، اربطه، وانشر مباشرة على حسابك من عندنا.</p>

          {needsTable ? (
            <Card className="p-3 text-xs bg-muted/30">⚠️ فعّل الميزة مرّة واحدة: شغّل كود جدول <code>oji_connectors</code> في Supabase (موجود في صفحة <Link href="/automations/connect" className="text-primary underline">ربط الخدمات</Link>).</Card>
          ) : (
            <div className="space-y-3">
              <div className="grid sm:grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs">المنصّة</Label>
                  <select value={platform} onChange={(e) => setPlatform(e.target.value as ApiPlatform)} className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                    {API_PLATFORMS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-xs">التوكن (Access Token)</Label>
                  <Input value={token} onChange={(e) => setToken(e.target.value)} placeholder="الصق التوكن هنا" dir="ltr" className="mt-1" />
                </div>
              </div>
              <div>
                <Label className="text-xs">{currentPlatform.targetLabel}</Label>
                <Input value={target} onChange={(e) => setTarget(e.target.value)} placeholder={currentPlatform.targetPlaceholder} dir="ltr" className="mt-1" />
              </div>
              <Button onClick={connect} disabled={connecting || !token.trim()} variant="gradient">
                {connecting ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />} اربط {currentPlatform.label}
              </Button>

              {connected.length > 0 && (
                <div className="border-t pt-3 space-y-4">
                  <div>
                    <p className="text-xs font-medium mb-2">منصّاتك المربوطة — انشر عليها الآن:</p>
                    <div className="flex flex-wrap gap-2">
                      {API_PLATFORMS.filter((p) => connected.includes(p.id)).map((p) => (
                        <Button key={p.id} size="sm" variant="gradient" onClick={() => publishTo(p.id)} disabled={publishingTo === p.id}>
                          {publishingTo === p.id ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />} انشر على {p.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* الجدولة */}
                  <div className="rounded-lg border p-3 bg-muted/20 space-y-2">
                    <p className="text-xs font-medium flex items-center gap-1.5"><Calendar className="size-3.5 text-primary" /> جدولة النشر (ينتشر تلقائياً في الوقت اللي تحدّده)</p>
                    <div className="grid sm:grid-cols-3 gap-2">
                      <select value={schedulePlatform} onChange={(e) => setSchedulePlatform(e.target.value as ApiPlatform)} className="h-9 px-2 rounded-md border border-input bg-background text-xs">
                        {API_PLATFORMS.filter((p) => connected.includes(p.id)).map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                      </select>
                      <input type="datetime-local" value={scheduleAt} onChange={(e) => setScheduleAt(e.target.value)} className="h-9 px-2 rounded-md border border-input bg-background text-xs" />
                      <Button size="sm" variant="outline" onClick={schedulePost} disabled={scheduling}>
                        {scheduling ? <Loader2 className="size-4 animate-spin" /> : <Calendar className="size-4" />} جدولة
                      </Button>
                    </div>
                    {scheduled.filter((s) => s.status === "pending").length > 0 && (
                      <div className="space-y-1 pt-1">
                        {scheduled.filter((s) => s.status === "pending").map((s) => (
                          <div key={s.id} className="flex items-center justify-between text-[11px] rounded border bg-background px-2 py-1">
                            <span>🕒 {s.platform} — {new Date(s.publish_at).toLocaleString("ar")}</span>
                            <button onClick={() => cancelScheduled(s.id)} className="text-destructive"><X className="size-3.5" /></button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* أدوات جدولة خارجية */}
        <div className="border-t pt-4">
          <p className="text-sm font-semibold mb-1 flex items-center gap-2"><Calendar className="size-4 text-primary" /> أدوات جدولة خارجية (اختياري)</p>
          <p className="text-xs text-muted-foreground mb-3">دي مواقع مستقلّة تسجّل فيها لوحدها لو حابب تجدول — مش جزء من موقعنا. <Link href="/learn/publishing" className="text-primary underline">إيه الفرق؟</Link></p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            {[
              { n: "Buffer", d: "3 حسابات + 10 منشورات مجاناً", u: "https://buffer.com" },
              { n: "Later", d: "Visual planning للسوشيال", u: "https://later.com" },
              { n: "Metricool", d: "جدولة + تحليلات", u: "https://metricool.com" },
              { n: "Publer", d: "3 حسابات مجاناً", u: "https://publer.io" },
              { n: "Meta Creator Studio", d: "مجاني — Instagram + Facebook", u: "https://business.facebook.com/latest/home" },
              { n: "Hootsuite", d: "للوكالات والفرق", u: "https://hootsuite.com" },
            ].map((t) => (
              <a key={t.n} href={t.u} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 rounded-md border hover:border-primary hover:bg-accent/30 transition-all">
                <div><div className="font-medium">{t.n}</div><div className="text-xs text-muted-foreground">{t.d}</div></div>
                <ExternalLink className="size-3" />
              </a>
            ))}
          </div>
        </div>

        <Card className="p-3 bg-muted/20 flex items-start gap-2 text-xs">
          <Info className="size-4 text-primary shrink-0 mt-0.5" />
          <span className="text-muted-foreground">X (تويتر) وتيك توك بيحتاجوا OAuth للنشر التلقائي — دلوقتي بنستخدم «نسخ + فتح» ليهم. التفاصيل في <Link href="/learn/publishing" className="text-primary underline">صفحة الشرح</Link>.</span>
        </Card>
      </Card>
    </div>
  );
}
