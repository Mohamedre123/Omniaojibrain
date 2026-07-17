"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { Link2, Loader2, Plus, Trash2, Copy, Check, QrCode, Upload, ExternalLink } from "lucide-react";

type BioLink = { label: string; url: string };
const THEMES = [
  { id: "violet", label: "بنفسجي" }, { id: "blue", label: "أزرق" }, { id: "emerald", label: "أخضر" },
  { id: "rose", label: "وردي" }, { id: "amber", label: "برتقالي" }, { id: "dark", label: "داكن" },
];

export default function BioPage() {
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [bio, setBio] = useState("");
  const [logo, setLogo] = useState("");
  const [theme, setTheme] = useState("violet");
  const [links, setLinks] = useState<BioLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [needsTable, setNeedsTable] = useState(false);
  const [qr, setQr] = useState("");
  const [copied, setCopied] = useState(false);

  const publicUrl = typeof window !== "undefined" && slug ? `${window.location.origin}/l/${slug}` : "";

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const s = user.id.slice(0, 8);
      setSlug(s);
      const { data, error } = await supabase.from("bio_pages").select("*").eq("user_id", user.id).maybeSingle();
      if (error) { setNeedsTable(true); setLoading(false); return; }
      if (data) {
        setTitle(data.title || ""); setBio(data.bio || ""); setLogo(data.logo_url || "");
        setTheme(data.theme || "violet"); setLinks((data.links as BioLink[]) || []);
        if (data.slug) setSlug(data.slug);
      }
      setLoading(false);
    })();
  }, []);

  async function uploadLogo(file: File | null) {
    if (!file || !file.type.startsWith("image/")) { toast.error("لازم صورة"); return; }
    if (file.size > 4 * 1024 * 1024) { toast.error("أكبر من 4MB"); return; }
    setUploading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const ext = file.type.includes("png") ? "png" : "jpg";
      const path = `${user.id}/brand/bio-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("uploads").upload(path, file, { contentType: file.type, upsert: true });
      if (error) { toast.error("تعذّر الرفع"); return; }
      const { data: signed } = await supabase.storage.from("uploads").createSignedUrl(path, 31536000);
      if (signed?.signedUrl) setLogo(signed.signedUrl);
    } finally { setUploading(false); }
  }

  async function save() {
    setSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const clean = links.filter((l) => l.label.trim() && l.url.trim());
      const { error } = await supabase.from("bio_pages").upsert({
        user_id: user.id, slug, title: title.trim() || null, bio: bio.trim() || null,
        logo_url: logo || null, theme, links: clean, updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
      if (error) { toast.error("تعذّر الحفظ", { description: error.message }); return; }
      toast.success("اتحفظت صفحتك ✓");
    } finally { setSaving(false); }
  }

  async function makeQr() {
    if (!publicUrl) return;
    const QR = (await import("qrcode")).default;
    setQr(await QR.toDataURL(publicUrl, { width: 600, margin: 2 }));
  }

  function copy() { navigator.clipboard.writeText(publicUrl).then(() => { setCopied(true); toast.success("اتنسخ الرابط"); setTimeout(() => setCopied(false), 1500); }); }

  if (loading) return <div className="grid place-items-center py-20"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>;
  if (needsTable) return <div className="container mx-auto px-4 py-8 max-w-2xl"><Card className="p-5 text-sm">⚠️ الميزة تحتاج تفعيلاً: شغّل كود جدول <code>bio_pages</code> في Supabase مرة واحدة، ثم حدّث الصفحة.</Card></div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2"><Link2 className="size-7 text-primary" /> صفحة الروابط (Bio Link)</h1>
        <p className="text-muted-foreground mt-1 text-sm">صفحة واحدة تجمع كل روابطك (زي Linktree) بلوجوك ونصّك — بلينك عام و QR.</p>
      </div>

      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-3">
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt="" className="size-16 rounded-full object-cover border" />
          ) : <div className="size-16 rounded-full border-2 border-dashed grid place-items-center text-muted-foreground"><Upload className="size-5" /></div>}
          <label className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm cursor-pointer hover:border-primary ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
            <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadLogo(e.target.files?.[0] || null)} />
            {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />} {logo ? "تغيير اللوجو" : "رفع لوجو"}
          </label>
        </div>
        <div><Label>الاسم/العنوان</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="اسم علامتك أو حسابك" className="mt-1" /></div>
        <div><Label>نبذة</Label><Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={2} placeholder="سطر تعريفي قصير" className="mt-1" dir="auto" /></div>
        <div>
          <Label>اللون</Label>
          <div className="mt-1 flex flex-wrap gap-2">
            {THEMES.map((t) => <button key={t.id} onClick={() => setTheme(t.id)} className={`px-3 py-1.5 rounded-md text-xs border ${theme === t.id ? "bg-primary text-primary-foreground border-primary" : ""}`}>{t.label}</button>)}
          </div>
        </div>
        <div>
          <Label>الروابط والأزرار</Label>
          <div className="mt-2 space-y-2">
            {links.map((l, i) => (
              <div key={i} className="flex gap-2">
                <Input value={l.label} onChange={(e) => setLinks((p) => p.map((x, idx) => idx === i ? { ...x, label: e.target.value } : x))} placeholder="اسم الزر (مثلاً: متجري)" className="flex-1" />
                <Input dir="ltr" value={l.url} onChange={(e) => setLinks((p) => p.map((x, idx) => idx === i ? { ...x, url: e.target.value } : x))} placeholder="https://" className="flex-1" />
                <button onClick={() => setLinks((p) => p.filter((_, idx) => idx !== i))} className="text-destructive shrink-0"><Trash2 className="size-4" /></button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => setLinks((p) => [...p, { label: "", url: "" }])}><Plus className="size-4" /> أضف رابط</Button>
          </div>
        </div>
        <Button onClick={save} disabled={saving} variant="gradient" className="w-full">{saving ? <Loader2 className="size-4 animate-spin" /> : null} حفظ الصفحة</Button>
      </Card>

      {publicUrl && (
        <Card className="p-5 mt-5 space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 h-11 px-3 rounded-lg border bg-muted/40 grid items-center text-sm truncate" dir="ltr">{publicUrl}</div>
            <Button onClick={copy} variant="outline" className="shrink-0">{copied ? <Check className="size-4" /> : <Copy className="size-4" />} نسخ</Button>
            <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 h-11 text-sm hover:bg-accent shrink-0"><ExternalLink className="size-4" /> فتح</a>
          </div>
          <Button onClick={makeQr} variant="outline" className="w-full"><QrCode className="size-4" /> توليد QR للصفحة</Button>
          {qr && (
            <div className="text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qr} alt="QR" className="mx-auto size-44 rounded-lg" />
              <a href={qr} download="oji-bio-qr.png" className="text-sm text-primary hover:underline">تحميل QR</a>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
