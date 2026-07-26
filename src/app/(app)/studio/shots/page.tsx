"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Aperture, Loader2, Download, Paperclip, X, ArrowRight } from "lucide-react";
import { saveImageToLibrary } from "@/lib/media-library";

type Shot = { label: string; status: "loading" | "done" | "error"; src?: string; error?: string };

type Angle = { label: string; type: "pose" | "detail" | "product"; instr: string };

// وضعيات مختلفة لنفس الشخص في نفس المكان + لقطتين للطقم لوحده
const ANGLES: Angle[] = [
  { label: "أمامية", type: "pose", instr: "standing and facing the camera directly with a relaxed, confident posture" },
  { label: "ثلاثة أرباع يمين", type: "pose", instr: "turned to a three-quarter angle toward the right, same standing spot" },
  { label: "ثلاثة أرباع يسار", type: "pose", instr: "turned to a three-quarter angle toward the left, same standing spot" },
  { label: "جانبية", type: "pose", instr: "standing in a full side profile so the outfit is seen clearly from the side" },
  { label: "من الخلف", type: "pose", instr: "seen from behind to reveal the back of the outfit, head slightly turned" },
  { label: "يمشي في نفس المكان", type: "pose", instr: "walking naturally to a slightly different spot within the SAME location, candid mid-step motion" },
  { label: "تفاصيل القماش", type: "detail", instr: "" },
  { label: "الطقم لوحده (فلات-لاي)", type: "product", instr: "a clean top-down flat-lay of the full outfit only, neatly arranged" },
  { label: "الطقم معروض", type: "product", instr: "the outfit only, professionally styled and displayed on a clean surface or table" },
];

function buildShotPrompt(a: Angle, aspect: string, hint: string): string {
  const focus = hint.trim()
    ? `Focus on this exact item from the reference: ${hint.trim()}.`
    : `First identify the main person and their exact outfit/product in the reference image.`;

  if (a.type === "product") {
    return `${focus}
Extract the OUTFIT / PRODUCT ONLY from the reference and remove the person completely. ${a.instr}.
Keep the garments 100% identical to the reference: exact same colors, fabric, texture, stitching, seams, logo, print and proportions.
Professional e-commerce product photography, clean styling that matches the color palette and mood of the reference, soft realistic shadows.
Absolutely NO person and no body parts. Photorealistic, ultra-detailed, real photograph, 8K. Aspect ratio ${aspect}.`;
  }

  const shot = a.type === "detail"
    ? "a cinematic macro close-up on the fabric texture, stitching, seams and logo of the exact same outfit worn by the same person"
    : `the same person ${a.instr}`;

  return `${focus}
Produce a PHOTOREALISTIC professional photograph of ${shot}.
KEEP 100% IDENTICAL — do NOT change any of these:
- the person's face, facial features, skin tone, hair and body shape,
- the exact outfit: same colors, fabric, texture, stitching, logo, print and design,
- the SAME location, background, props and lighting as the reference image.
Only change the pose / body position / framing within that same place — like a real photoshoot of the same model in the same spot.
Do NOT stylize, illustrate, cartoonify or beautify. It must look like a REAL photograph, not AI-generated. Natural realistic skin and materials. Cinematic editorial lighting, sharp focus, 8K photorealistic. Aspect ratio ${aspect}.`;
}

const ASPECTS = [
  { label: "مربّع 1:1", value: "1:1" },
  { label: "بورتريه 4:5", value: "4:5" },
  { label: "ستوري 9:16", value: "9:16" },
  { label: "أفقي 16:9", value: "16:9" },
];

export default function ShotsPage() {
  const [ref, setRef] = useState<{ data: string; mimeType: string; previewUrl: string } | null>(null);
  const [shots, setShots] = useState<Shot[]>([]);
  const [aspect, setAspect] = useState("4:5");
  const [hint, setHint] = useState("");
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
        const prompt = buildShotPrompt(a, aspect, hint);
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
          <p className="text-muted-foreground mt-1 text-sm">ارفع صورة الطقم/المنتج → 9 لقطات احترافية: نفس الشخص والمكان والطقم بالظبط، بس وضعيات وحركات مختلفة + لقطتين للطقم لوحده. واقعية زي التصوير السينمائي.</p>
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
          <p className="text-sm font-medium mb-1">ركّز على إيه؟ (اختياري)</p>
          <input
            value={hint}
            onChange={(e) => setHint(e.target.value)}
            placeholder="مثلاً: العباية اللي البنت لابساها / التيشيرت / المنتج اللي في الإيد"
            dir="auto"
            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
          />
        </div>
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
                  <img src={s.src} alt={s.label} className="w-full h-auto rounded-lg" />
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
