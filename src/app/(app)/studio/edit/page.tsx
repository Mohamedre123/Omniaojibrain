"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Wand2, Loader2, Download, Paperclip, X, ArrowRight, FolderOpen } from "lucide-react";
import { saveImageToLibrary } from "@/lib/media-library";

type Ref = { data: string; mimeType: string; previewUrl: string };

const ACTIONS = [
  { label: "🏢 خلفية استوديو", instr: "Replace the background with a clean professional studio backdrop with soft lighting. Keep the subject identical." },
  { label: "✨ تحسين الجودة", instr: "Enhance this image to ultra-high 8K quality: sharpen details, improve lighting and colors. Keep everything identical." },
  { label: "🎬 لمسة سينمائية", instr: "Apply a cinematic color grade and dramatic lighting while keeping the subject identical." },
  { label: "⚫ أبيض وأسود", instr: "Convert to an elegant high-contrast black and white photo." },
];

export default function EditImagePage() {
  const [ref, setRef] = useState<Ref | null>(null);
  const [instr, setInstr] = useState("");
  const [busy, setBusy] = useState(false);
  const [removingBg, setRemovingBg] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [transparent, setTransparent] = useState(false);

  function handleFile(file: File | null) {
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) { toast.error("الصورة أكبر من 8MB"); return; }
    if (!file.type.startsWith("image/")) { toast.error("لازم صورة"); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const r = reader.result as string;
      setRef({ data: r.split(",")[1] || "", mimeType: file.type, previewUrl: URL.createObjectURL(file) });
    };
    reader.readAsDataURL(file);
  }

  async function shrink(dataB64: string, mime: string): Promise<{ data: string; mimeType: string }> {
    return new Promise((resolve) => {
      try {
        const img = new Image();
        img.onload = () => {
          const max = 1280; let { width, height } = img;
          if (Math.max(width, height) > max) { const s = max / Math.max(width, height); width = Math.round(width * s); height = Math.round(height * s); }
          const c = document.createElement("canvas"); c.width = width; c.height = height;
          const ctx = c.getContext("2d"); if (!ctx) return resolve({ data: dataB64, mimeType: mime });
          ctx.drawImage(img, 0, 0, width, height);
          resolve({ data: c.toDataURL("image/jpeg", 0.9).split(",")[1] || dataB64, mimeType: "image/jpeg" });
        };
        img.onerror = () => resolve({ data: dataB64, mimeType: mime });
        img.src = `data:${mime};base64,${dataB64}`;
      } catch { resolve({ data: dataB64, mimeType: mime }); }
    });
  }

  // إزالة خلفية حقيقية (PNG شفاف) — تشتغل على جهاز العميل
  async function removeBg() {
    if (!ref) { toast.error("ارفع صورة أولاً"); return; }
    setRemovingBg(true); setResult(null); setTransparent(false);
    const t = toast.loading("جاري إزالة الخلفية… (أول مرة بتحمّل الموديل، استنى شوية)");
    try {
      const { removeBackground } = await import("@imgly/background-removal");
      const blob = await removeBackground(`data:${ref.mimeType};base64,${ref.data}`, {
        // مصدر موثوق لملفات الموديل (يحلّ Failed to fetch)
        publicPath: "https://cdn.jsdelivr.net/npm/@imgly/background-removal-data@1/dist/",
      });
      const objUrl = URL.createObjectURL(blob);
      setResult(objUrl);
      setTransparent(true);
      // احفظ في ملفاتي كـ PNG شفاف
      const b64 = await new Promise<string>((res) => {
        const r = new FileReader();
        r.onload = () => res(((r.result as string) || "").split(",")[1] || "");
        r.readAsDataURL(blob);
      });
      if (b64) void saveImageToLibrary(b64, "image/png").then((ok) => { if (ok) toast.success("اتحفظت في ملفاتي (PNG شفاف)"); });
      toast.dismiss(t);
    } catch (e) {
      toast.dismiss(t);
      toast.error("تعذّرت إزالة الخلفية", { description: e instanceof Error ? e.message.slice(0, 100) : undefined });
    } finally {
      setRemovingBg(false);
    }
  }

  async function run(instruction: string) {
    if (!ref) { toast.error("ارفع صورة أولاً"); return; }
    if (!instruction.trim()) { toast.error("اختر تعديلاً أو اكتب المطلوب"); return; }
    setBusy(true); setResult(null); setTransparent(false);
    try {
      const small = await shrink(ref.data, ref.mimeType);
      const res = await fetch("/api/image-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `${instruction} IMPORTANT: apply the change to the attached image and keep all other elements identical.`,
          quality: "high",
          provider: "gemini",
          refImages: [small],
        }),
      });
      if (res.status === 401) { toast.error("انتهت الجلسة"); return; }
      const data = await res.json();
      if (!res.ok || !data.images?.length) { toast.error(data.error || "تعذّر التعديل"); return; }
      const img = data.images[0] as { data: string; mimeType: string };
      setResult(`data:${img.mimeType};base64,${img.data}`);
      void saveImageToLibrary(img.data, img.mimeType).then((ok) => { if (ok) toast.success("اتحفظت في ملفاتي"); });
    } catch { toast.error("تعذّر الاتصال"); } finally { setBusy(false); }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2"><Wand2 className="size-7 text-primary" /> تحرير الصور</h1>
          <p className="text-muted-foreground mt-1 text-sm">ارفع صورة، واختر تعديلاً سريعاً أو اكتب اللي عايزه.</p>
        </div>
        <Link href="/studio" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary shrink-0"><ArrowRight className="size-4" /> الاستوديو</Link>
      </div>

      <Card className="p-5 space-y-4">
        {ref ? (
          <div className="relative w-fit">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ref.previewUrl} alt="الأصل" className="max-h-56 rounded-lg border" />
            <button onClick={() => { setRef(null); setResult(null); }} className="absolute top-1 right-1 size-6 rounded-full bg-destructive text-white grid place-items-center"><X className="size-3.5" /></button>
          </div>
        ) : (
          <label className="grid place-items-center gap-2 h-40 rounded-xl border-2 border-dashed cursor-pointer hover:border-primary text-muted-foreground text-sm">
            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0] || null)} />
            <Paperclip className="size-6" /> ارفع صورة للتعديل
          </label>
        )}

        {/* إزالة خلفية حقيقية — PNG شفاف */}
        <Button onClick={removeBg} disabled={removingBg || busy || !ref} variant="outline" className="w-full">
          {removingBg ? <Loader2 className="size-4 animate-spin" /> : "🧹"} إزالة الخلفية (PNG شفاف حقيقي)
        </Button>

        <div className="flex flex-wrap gap-2">
          {ACTIONS.map((a) => (
            <button key={a.label} onClick={() => run(a.instr)} disabled={busy || removingBg || !ref} className="rounded-full border px-3 py-1.5 text-xs hover:border-primary disabled:opacity-50">
              {a.label}
            </button>
          ))}
        </div>

        <div>
          <Textarea value={instr} onChange={(e) => setInstr(e.target.value)} rows={2} dir="auto" placeholder="أو اكتب تعديلاً مخصصاً: خليها ليلاً، غيّر لون المنتج لأزرق، ضيف بخار..." />
        </div>
        <Button onClick={() => run(instr)} disabled={busy || !ref} variant="gradient" className="w-full">
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />} {busy ? "جاري التعديل…" : "طبّق التعديل"}
        </Button>
      </Card>

      {result && (
        <Card className="p-4 mt-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-primary">النتيجة</span>
            <div className="flex items-center gap-3">
              <a href={result} download={`oji-edit-${Date.now()}.png`} className="inline-flex items-center gap-1 text-sm text-primary"><Download className="size-4" /> تحميل PNG</a>
              <Link href="/studio/library" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"><FolderOpen className="size-4" /> ملفاتي</Link>
            </div>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={result}
            alt="النتيجة"
            className="w-full rounded-lg"
            style={transparent ? { backgroundImage: "linear-gradient(45deg,#ccc 25%,transparent 25%),linear-gradient(-45deg,#ccc 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#ccc 75%),linear-gradient(-45deg,transparent 75%,#ccc 75%)", backgroundSize: "20px 20px", backgroundPosition: "0 0,0 10px,10px -10px,-10px 0" } : undefined}
          />
          {transparent && <p className="text-xs text-muted-foreground mt-2">✅ خلفية شفافة فعلاً — المربّعات دي بس عشان تبيّن الشفافية.</p>}
        </Card>
      )}
    </div>
  );
}
