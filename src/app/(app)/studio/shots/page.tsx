"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Aperture, Loader2, Download, Paperclip, X, ArrowRight } from "lucide-react";
import { saveImageToLibrary } from "@/lib/media-library";

type Shot = { label: string; status: "loading" | "done" | "error"; src?: string; error?: string };

const ANGLES = [
  { label: "أمامية", instr: "front view, straight-on" },
  { label: "ثلاثة أرباع يسار", instr: "three-quarter angle from the left" },
  { label: "ثلاثة أرباع يمين", instr: "three-quarter angle from the right" },
  { label: "جانبية", instr: "side profile view" },
  { label: "خلفية", instr: "back view" },
  { label: "من فوق", instr: "top-down flat-lay view" },
  { label: "زاوية منخفضة", instr: "dramatic low hero angle" },
  { label: "ماكرو (تفاصيل)", instr: "extreme macro close-up on key details" },
  { label: "مشهد حياتي", instr: "in a tasteful lifestyle scene, still same subject" },
];

const ASPECTS = [
  { label: "مربّع 1:1", value: "1:1" },
  { label: "بورتريه 4:5", value: "4:5" },
  { label: "ستوري 9:16", value: "9:16" },
  { label: "أفقي 16:9", value: "16:9" },
];

export default function ShotsPage() {
  const [ref, setRef] = useState<{ data: string; mimeType: string; previewUrl: string } | null>(null);
  const [shots, setShots] = useState<Shot[]>([]);
  const [aspect, setAspect] = useState("1:1");
  const [busy, setBusy] = useState(false);

  function handleFile(file: File | null) {
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) { toast.error("الصورة أكبر من 8MB"); return; }
    if (!file.type.startsWith("image/")) { toast.error("لازم صورة"); return; }
    const r = new FileReader();
    r.onload = () => { const res = r.result as string; setRef({ data: res.split(",")[1] || "", mimeType: file.type, previewUrl: URL.createObjectURL(file) }); };
    r.readAsDataURL(file);
  }

  async function shrink(dataB64: string, mime: string): Promise<{ data: string; mimeType: string }> {
    return new Promise((resolve) => {
      try {
        const img = new Image();
        img.onload = () => {
          const max = 1024; let { width, height } = img;
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

  async function generate() {
    if (!ref) { toast.error("ارفع صورة المنتج/الشخص أولاً"); return; }
    setBusy(true);
    setShots(ANGLES.map((a) => ({ label: a.label, status: "loading" })));
    const small = await shrink(ref.data, ref.mimeType);

    await Promise.all(ANGLES.map((a, i) => (async () => {
      try {
        const prompt = `First, understand the reference image: identify the subject type (a garment/clothing/abaya, a person/model, a product, food, etc.) and its key details. Then produce a professional photograph of the SAME subject shown from: ${a.instr}.
CRITICAL identity rules:
- Keep the subject 100% identical to the reference: exact same shape, colors, logo, packaging, patterns, and — for clothing — the exact same fabric, material, texture, stitching, folds and design details.
- For a person: keep the same face, body, and outfit details.
- Only change the camera angle / composition; do NOT change the subject itself.
Present it the way this type of subject is best displayed (e.g., clothing on a model or elegant flat-lay showing fabric detail).
8K ultra-realistic, clean professional commercial lighting. Aspect ratio ${aspect}.`;
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
    toast.success("خلص — كل اللقطات اتحفظت في ملفاتي");
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2"><Aperture className="size-7 text-primary" /> 9 لقطات (Shots)</h1>
          <p className="text-muted-foreground mt-1 text-sm">ارفع صورة منتجك أو شخص، ويطلّعلك 9 لقطات من زوايا مختلفة — بنفس الهوية بالظبط.</p>
        </div>
        <Link href="/studio" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary shrink-0"><ArrowRight className="size-4" /> الاستوديو</Link>
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
            <Paperclip className="size-6" /> ارفع صورة المنتج / الشخص
          </label>
        )}
        <div>
          <p className="text-sm font-medium mb-1">المقاس</p>
          <div className="flex flex-wrap gap-2">
            {ASPECTS.map((a) => (
              <button key={a.value} onClick={() => setAspect(a.value)} className={`px-3 py-1.5 rounded-md text-xs border transition-all ${aspect === a.value ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:border-primary/50"}`}>{a.label}</button>
            ))}
          </div>
        </div>
        <Button onClick={generate} disabled={busy || !ref} variant="gradient" size="lg" className="w-full">
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Aperture className="size-4" />} {busy ? "جاري توليد 9 لقطات…" : "توليد 9 لقطات"}
        </Button>
      </Card>

      {shots.length > 0 && (
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {shots.map((s, i) => (
            <Card key={i} className="p-2 overflow-hidden">
              {s.status === "done" && s.src ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.src} alt={s.label} className="w-full rounded-lg aspect-square object-cover" />
                  <div className="flex items-center justify-between mt-1.5 px-1">
                    <span className="text-[11px] text-muted-foreground truncate">{s.label}</span>
                    <a href={s.src} download={`oji-shot-${i}.png`} className="text-primary shrink-0"><Download className="size-4" /></a>
                  </div>
                </>
              ) : (
                <div className="aspect-square rounded-lg grid place-items-center text-center p-2 bg-muted/40">
                  {s.status === "error" ? <span className="text-[11px] text-destructive">⚠️ {s.label}</span> : <div className="flex flex-col items-center gap-1"><Loader2 className="size-5 animate-spin text-muted-foreground" /><span className="text-[10px] text-muted-foreground">{s.label}</span></div>}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
      <p className="mt-4 text-center text-xs text-muted-foreground">💡 كل اللقطات بتتحفظ في ملفاتي تلقائياً.</p>
    </div>
  );
}
