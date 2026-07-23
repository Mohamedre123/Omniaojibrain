"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, Loader2, Download, Paperclip, X, ArrowRight } from "lucide-react";
import { saveImageToLibrary } from "@/lib/media-library";

type Shot = { label: string; status: "idle" | "loading" | "done" | "error"; src?: string; error?: string };

const SCENES = [
  { label: "رمضان", instr: "warm Ramadan setting: brass lantern (fanoos), dates, crescent moon bokeh, deep emerald and gold tones, cozy evening light" },
  { label: "فخامة", instr: "luxury editorial: black marble surface, gold accents, dramatic spotlight, elegant reflections, premium high-end mood" },
  { label: "مينيمال", instr: "clean minimal studio: soft pastel seamless background, gentle shadows, lots of negative space, modern Scandinavian aesthetic" },
  { label: "صيفي", instr: "bright summer scene: sunlight, tropical leaves, water splashes, vivid blue and warm tones, fresh energetic vibe" },
  { label: "خشب دافئ", instr: "warm rustic wooden table, natural morning light, soft linen, cozy artisanal café feel" },
  { label: "رخام أبيض", instr: "white marble surface with soft daylight, airy bright premium look, subtle green plant shadow" },
  { label: "طبيعي أخضر", instr: "natural botanical scene surrounded by fresh green leaves and soft daylight, organic eco feel" },
  { label: "استوديو داكن", instr: "moody dark studio with a single dramatic rim light, deep shadows, cinematic premium product look" },
];

const ASPECTS = [
  { label: "مربّع 1:1", value: "1:1" },
  { label: "بورتريه 4:5", value: "4:5" },
  { label: "ستوري 9:16", value: "9:16" },
];

export default function PhotoshootPage() {
  const [ref, setRef] = useState<{ data: string; mimeType: string; previewUrl: string } | null>(null);
  const [shots, setShots] = useState<Shot[]>([]);
  const [aspect, setAspect] = useState("4:5");
  const [hint, setHint] = useState("");
  const [selected, setSelected] = useState<string[]>(SCENES.slice(0, 4).map((s) => s.label));
  const [busy, setBusy] = useState(false);

  function handleFile(file: File | null) {
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) { toast.error("الصورة أكبر من 8MB"); return; }
    if (!file.type.startsWith("image/")) { toast.error("لازم صورة"); return; }
    const r = new FileReader();
    r.onload = () => { const res = r.result as string; setRef({ data: res.split(",")[1] || "", mimeType: file.type, previewUrl: URL.createObjectURL(file) }); };
    r.readAsDataURL(file);
  }

  function toggle(label: string) {
    setSelected((p) => (p.includes(label) ? p.filter((x) => x !== label) : [...p, label]));
  }

  async function shrink(dataB64: string, mime: string): Promise<{ data: string; mimeType: string }> {
    return new Promise((resolve) => {
      try {
        const img = new Image();
        img.onload = () => {
          const max = 1024; let { width, height } = img;
          if (Math.max(width, height) > max) { const sc = max / Math.max(width, height); width = Math.round(width * sc); height = Math.round(height * sc); }
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

  async function generate() {
    if (!ref) { toast.error("ارفع صورة المنتج أولاً"); return; }
    const scenes = SCENES.filter((s) => selected.includes(s.label));
    if (!scenes.length) { toast.error("اختر مشهداً واحداً على الأقل"); return; }
    setBusy(true);
    setShots(scenes.map((s) => ({ label: s.label, status: "loading" })));
    const small = await shrink(ref.data, ref.mimeType);

    await Promise.all(scenes.map((sc, i) => (async () => {
      try {
        const focusLine = hint.trim()
          ? `The product to feature is: ${hint.trim()}. Extract exactly this product from the reference image.`
          : "First, identify the main product in the reference image.";
        const prompt = `${focusLine}
Then place that SAME product into a professional product-photography scene: ${sc.instr}.
CRITICAL: keep the product 100% identical to the reference — exact same shape, colors, logo, label, packaging and material. Only change the background scene, styling and lighting; never alter the product itself.
Editorial commercial product photography, tasteful props, realistic shadows and reflections.
8K ultra-realistic. Aspect ratio ${aspect}.`;
        const res = await fetch("/api/image-generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, quality: "high", provider: "gemini", aspect, refImages: [small] }),
        });
        const data = await res.json();
        if (!res.ok || !data.images?.length) { setShots((p) => p.map((s, idx) => idx === i ? { ...s, status: "error", error: data.error || "فشل" } : s)); return; }
        const img = data.images[0] as { data: string; mimeType: string };
        setShots((p) => p.map((s, idx) => idx === i ? { ...s, status: "done", src: `data:${img.mimeType};base64,${img.data}` } : s));
        void saveImageToLibrary(img.data, img.mimeType);
      } catch {
        setShots((p) => p.map((s, idx) => idx === i ? { ...s, status: "error", error: "تعذّر الاتصال" } : s));
      }
    })()));
    setBusy(false);
    toast.success("خلص — كل المشاهد اتحفظت في ملفاتي");
  }

  function download(src: string, label: string) {
    const a = document.createElement("a");
    a.href = src; a.download = `photoshoot-${label}.png`; a.click();
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2"><Camera className="size-7 text-primary" /> ثيمات جلسة تصوير المنتج</h1>
          <p className="text-muted-foreground mt-1 text-sm">ارفع صورة منتجك، واختر المشاهد الجاهزة — Oji يصوّره في كل ثيم بنفس هويته بالظبط.</p>
        </div>
        <Link href="/marketing" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary shrink-0"><ArrowRight className="size-4" /> الماركتنج</Link>
      </div>

      <Card className="p-5 space-y-4">
        {ref ? (
          <div className="relative w-fit">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ref.previewUrl} alt="" className="max-h-48 rounded-lg border" />
            <button onClick={() => { setRef(null); setShots([]); }} className="absolute top-1 right-1 size-6 rounded-full bg-destructive text-white grid place-items-center"><X className="size-3.5" /></button>
          </div>
        ) : (
          <label className="grid place-items-center gap-2 h-40 rounded-xl border-2 border-dashed cursor-pointer hover:border-primary text-muted-foreground text-sm">
            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0] || null)} />
            <Paperclip className="size-6" /> ارفع صورة المنتج
          </label>
        )}

        <div>
          <p className="text-sm font-medium mb-1">ركّز على إيه؟ (اختياري)</p>
          <input value={hint} onChange={(e) => setHint(e.target.value)} placeholder="مثلاً: العلبة / المنتج اللي في النص" dir="auto" className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm" />
        </div>

        <div>
          <p className="text-sm font-medium mb-2">المشاهد ({selected.length} مختارة)</p>
          <div className="flex flex-wrap gap-2">
            {SCENES.map((sc) => (
              <button key={sc.label} onClick={() => toggle(sc.label)} className={`px-3 py-1.5 rounded-md text-xs border transition-all ${selected.includes(sc.label) ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:border-primary/50"}`}>
                {sc.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium mb-2">المقاس</p>
          <div className="flex flex-wrap gap-2">
            {ASPECTS.map((a) => (
              <button key={a.value} onClick={() => setAspect(a.value)} className={`px-3 py-1.5 rounded-md text-xs border transition-all ${aspect === a.value ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:border-primary/50"}`}>{a.label}</button>
            ))}
          </div>
        </div>

        <Button onClick={generate} disabled={busy} variant="gradient" className="w-full" size="lg">
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}
          {busy ? "جاري التصوير..." : `صوّر (${selected.length})`}
        </Button>
      </Card>

      {shots.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-5">
          {shots.map((s) => (
            <div key={s.label} className="space-y-1">
              {s.status === "done" && s.src ? (
                <div className="relative group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.src} alt={s.label} className="w-full rounded-lg border object-cover" />
                  <button onClick={() => download(s.src!, s.label)} className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-md bg-black/70 text-white text-xs px-2 py-1 opacity-0 group-hover:opacity-100">
                    <Download className="size-3" /> تنزيل
                  </button>
                </div>
              ) : (
                <div className="aspect-[4/5] rounded-lg grid place-items-center text-center p-2 bg-muted/40 border">
                  {s.status === "error" ? <span className="text-xs text-destructive">{s.error || "فشل"}</span> : <Loader2 className="size-5 animate-spin text-muted-foreground" />}
                </div>
              )}
              <p className="text-xs text-center text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
