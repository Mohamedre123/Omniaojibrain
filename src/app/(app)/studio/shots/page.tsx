"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Aperture, Loader2, Download, Paperclip, X, ArrowRight } from "lucide-react";
import { saveImageToLibrary } from "@/lib/media-library";

type Shot = { label: string; status: "loading" | "done" | "error"; src?: string; error?: string };

type Angle = { label: string; type: "pose" | "detail" | "product"; instr: string; side?: "front" | "back" };

// مشاهد سينمائية متنوّعة لنفس الشخص/الطقم في نفس المكان + لقطتين للطقم لوحده
const ANGLES: Angle[] = [
  { label: "لقطة واسعة", type: "pose", instr: "a WIDE cinematic establishing shot — full body within the environment, natural confident stance, plenty of the scene visible around them" },
  { label: "لقطة متوسطة", type: "pose", instr: "a MEDIUM shot from roughly the waist up, relaxed candid pose, shallow depth of field" },
  { label: "بورتريه قريب", type: "pose", instr: "a CLOSE-UP upper-body / portrait shot highlighting the top garment, soft creamy bokeh background" },
  { label: "زاوية منخفضة", type: "pose", instr: "a dramatic LOW-ANGLE hero shot looking slightly upward, dynamic powerful stance" },
  { label: "وهو بيمشي", type: "pose", instr: "a candid motion shot of the person walking through a DIFFERENT part of the same location, natural mid-stride, sense of movement" },
  { label: "لقطة جانبية سينمائية", type: "pose", instr: "a cinematic side / profile composition at another spot in the scene, looking away, film-like off-center framing" },
  { label: "زوم على تفاصيل الطقم", type: "detail", instr: "" },
  { label: "الطقم لوحده (فلات-لاي)", type: "product", instr: "a clean top-down flat-lay of the full outfit only, neatly arranged" },
  { label: "الطقم معروض", type: "product", instr: "the outfit only, professionally styled and displayed on a clean surface or table" },
];

// وضع «وجهين للمنتج» — مرجع أمامي + مرجع خلفي: توزيع لقطات أمام/خلف عشان الطبعة الخلفية تطلع صح
const ANGLES_DUAL: Angle[] = [
  { label: "أمامية واسعة", type: "pose", side: "front", instr: "a WIDE cinematic establishing shot from the FRONT, full body, natural confident stance" },
  { label: "أمامية متوسطة", type: "pose", side: "front", instr: "a MEDIUM shot from the FRONT, waist up, relaxed candid pose, shallow depth of field" },
  { label: "بورتريه أمامي", type: "pose", side: "front", instr: "a CLOSE-UP FRONT portrait highlighting the front of the item, soft creamy bokeh" },
  { label: "خلفية واسعة", type: "pose", side: "back", instr: "a WIDE cinematic shot from BEHIND, full body, clearly revealing the BACK of the item and any back print/graphic" },
  { label: "خلفية قريبة (الطبعة)", type: "pose", side: "back", instr: "a CLOSE-UP from BEHIND zooming onto the BACK print/graphic and back details of the item" },
  { label: "وهو بيمشي (ضهر)", type: "pose", side: "back", instr: "a candid motion shot from behind, walking away through a different part of the same location, showing the back" },
  { label: "زوم على التفاصيل", type: "detail", instr: "" },
  { label: "المنتج لوحده (فلات-لاي)", type: "product", instr: "a clean top-down flat-lay of the item only, neatly arranged" },
  { label: "المنتج معروض", type: "product", instr: "the item only, professionally styled and displayed on a clean surface or table" },
];

const rand = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

// تنويعات عشوائية عشان كل توليد يطلع بشكل مختلف (نفس الفكرة، تنفيذ جديد)
const PERSON_LOOK = [
  "warm golden-hour sunlight", "soft overcast diffused light", "dramatic directional side light",
  "cool cinematic blue-hour tones", "bright airy natural daylight", "moody low-key lighting",
];
const PERSON_LENS = [
  "35mm lens natural perspective", "85mm portrait lens with creamy bokeh", "50mm filmic look",
  "wide 24mm cinematic perspective", "telephoto compressed background",
];
const GRADE = [
  "teal-and-orange film grade", "natural true-to-life grade", "warm editorial grade",
  "muted cinematic grade", "high-contrast filmic grade",
];
const PRODUCT_SURFACE = [
  "on a light marble surface", "on warm natural wood", "on smooth concrete",
  "on soft neutral linen", "on a matte studio backdrop", "on a textured stone slab",
];
const PRODUCT_LIGHT = [
  "soft daylight with gentle shadows", "moody directional studio light",
  "bright clean e-commerce lighting", "warm cinematic side light", "airy top light",
];

// بند واقعية موحّد — يمنع شكل البلاستيك/AI ويحافظ على جودة عالية
const REALISM =
  "It MUST look like a REAL photograph taken on a professional camera: natural realistic textures, true-to-life accurate colors, real fabric/material detail and subtle natural film grain. Absolutely NO plastic or CGI look, NO waxy over-smoothing, NO over-saturation or colors bleeding into each other, NO AI artifacts. High-resolution, clean, crisp and razor-sharp in focus.";

function buildShotPrompt(a: Angle, aspect: string, hint: string, dual = false): string {
  const focus = hint.trim()
    ? `Focus on this exact item from the reference: ${hint.trim()}.`
    : `First identify the main person and their exact outfit/product in the reference image.`;

  // في وضع الوجهين: صورة 1 = الأمام، صورة 2 = الخلف لنفس المنتج
  const dualHead = dual
    ? `IMPORTANT: TWO reference images are provided — image 1 is the FRONT and image 2 is the BACK of the SAME single item (one product, NOT two different items). `
    : "";
  const sideNote =
    dual && a.side === "back"
      ? `This is a BACK-facing shot: reproduce the BACK exactly from reference image 2, including any print, graphic or logo on the back. Do NOT invent or guess the back. `
      : dual && a.side === "front"
      ? `This is a FRONT-facing shot: reproduce the FRONT exactly from reference image 1. `
      : dual
      ? `Use both references accurately (front = image 1, back = image 2). `
      : "";

  if (a.type === "product") {
    return `${dualHead}${focus}
Extract the OUTFIT / PRODUCT ONLY from the reference and remove the person completely. ${a.instr}.
Keep the garments 100% identical to the reference: exact same colors, fabric, texture, stitching, seams, logo, print and proportions.${dual ? " Show it accurately using BOTH the front (image 1) and back (image 2) references." : ""}
Professional cinematic product photography, clean styling that matches the color palette and mood of the reference, soft realistic shadows.
For THIS specific shot use a FRESH, UNIQUE composition and arrangement: ${rand(PRODUCT_SURFACE)}, ${rand(PRODUCT_LIGHT)}. Never repeat the same layout.
Absolutely NO person and no body parts. ${REALISM} Aspect ratio ${aspect}.`;
  }

  if (a.type === "detail") {
    return `${dualHead}${focus}
Create ONE clean, ultra-sharp CINEMATIC MACRO close-up that ZOOMS onto the key detail of the item — the fabric weave and texture, the stitching/seams and the logo/label — filling most of the frame with a single beautiful detail (this is ONE photo, NOT a collage or grid).${dual ? " Focus on the main printed graphic / logo area — if the main graphic is on the back, use the back reference (image 2)." : ""}
Keep the detail 100% identical to the reference: same colors, fabric, texture, stitching, logo and print.
Beautiful soft directional product lighting, ${rand(PRODUCT_LIGHT)}, shallow depth of field with the key detail in razor-sharp focus. ${REALISM} Aspect ratio ${aspect}.`;
  }

  const shot = a.instr;

  return `${dualHead}${focus}
Create a NEW, genuinely DIFFERENT cinematic fashion-photography shot of the SAME real person wearing the SAME exact outfit, in the SAME overall location/environment as the reference — ${shot}.
${sideNote}KEEP IDENTICAL: the person's face, facial features, skin tone, hair and body; and the exact outfit (same colors, fabric, texture, stitching, logo, print and design). Keep the same general place/setting.
VARY it like a real cinematic photoshoot: change the camera DISTANCE, focal length, framing, angle, composition and the person's pose — and you MAY place them at ANY spot within that same location (it does NOT have to be the exact same standing position). Each shot must look clearly different, dynamic and film-like — NOT the same framing with a rotated body, NOT a static mannequin.
For THIS specific shot: ${rand(PERSON_LOOK)}, ${rand(PERSON_LENS)}, ${rand(GRADE)}.
Cinematic professional photography like a high-end fashion film (editorial): shallow depth of field where suitable, natural dynamic posing and real motion. Do NOT stylize, cartoonify or beautify. ${REALISM} Aspect ratio ${aspect}.`;
}

const ASPECTS = [
  { label: "مربّع 1:1", value: "1:1" },
  { label: "بورتريه 4:5", value: "4:5" },
  { label: "ستوري 9:16", value: "9:16" },
  { label: "أفقي 16:9", value: "16:9" },
];

type RefImg = { data: string; mimeType: string; previewUrl: string };

export default function ShotsPage() {
  const [ref, setRef] = useState<RefImg | null>(null);
  const [backRef, setBackRef] = useState<RefImg | null>(null);
  const [dualMode, setDualMode] = useState(false);
  const [shots, setShots] = useState<Shot[]>([]);
  const [aspect, setAspect] = useState("4:5");
  const [hint, setHint] = useState("");
  const [busy, setBusy] = useState(false);

  function readInto(file: File | null, setter: (r: RefImg) => void) {
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) { toast.error("الصورة أكبر من 8MB"); return; }
    if (!file.type.startsWith("image/")) { toast.error("لازم صورة"); return; }
    const r = new FileReader();
    r.onload = () => { const res = r.result as string; setter({ data: res.split(",")[1] || "", mimeType: file.type, previewUrl: URL.createObjectURL(file) }); };
    r.readAsDataURL(file);
  }
  function handleFile(file: File | null) { readInto(file, setRef); }

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
    if (dualMode && !backRef) { toast.error("ارفع صورة الوجه الخلفي كمان (أو ارجع لوضع صورة واحدة)"); return; }
    const angles = dualMode && backRef ? ANGLES_DUAL : ANGLES;
    setBusy(true);
    setShots(angles.map((a) => ({ label: a.label, status: "loading" })));
    const front = await shrink(ref.data, ref.mimeType);
    const back = dualMode && backRef ? await shrink(backRef.data, backRef.mimeType) : null;
    const refImages = back ? [front, back] : [front];
    const dual = !!back;

    await Promise.all(angles.map((a, i) => (async () => {
      try {
        const prompt = buildShotPrompt(a, aspect, hint, dual);
        const res = await fetch("/api/image-generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, quality: "high", provider: "gemini", aspect, refImages }),
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
          <p className="text-muted-foreground mt-1 text-sm">ارفع صورة الطقم/المنتج → 9 مشاهد سينمائية مختلفة: نفس الشخص والطقم والمكان، بس كاميرا وزوايا ووضعيات متنوّعة (واسعة/متوسطة/زوم) في أي حتة بالمكان + لقطتين للطقم لوحده — بروح سينمائية زي HIGGSFIELD.</p>
        </div>
        <Link href="/studio" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary shrink-0"><ArrowRight className="size-4" /> الاستوديو</Link>
      </div>

      <Card className="p-5 space-y-4">
        {/* وضع الرفع */}
        <div className="inline-flex rounded-lg border bg-background p-0.5 text-xs">
          <button onClick={() => setDualMode(false)} className={`px-3 py-1.5 rounded-md font-medium transition-all ${!dualMode ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>صورة واحدة</button>
          <button onClick={() => setDualMode(true)} className={`px-3 py-1.5 rounded-md font-medium transition-all ${dualMode ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>وجهين (أمام + خلف)</button>
        </div>

        {!dualMode ? (
          ref ? (
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
          )
        ) : (
          <div>
            <p className="text-xs text-muted-foreground mb-2">ارفع وجهَي نفس المنتج — Oji يفهم إنهم منتج واحد، ويطلّع لقطات أمامية وخلفية بدقّة (مفيدة لو في طبعة على الضهر).</p>
            <div className="grid grid-cols-2 gap-3">
              {([
                { label: "الوجه الأمامي", img: ref, set: setRef },
                { label: "الوجه الخلفي", img: backRef, set: setBackRef },
              ] as const).map((slot) => (
                <div key={slot.label}>
                  {slot.img ? (
                    <div className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={slot.img.previewUrl} alt={slot.label} className="w-full h-40 object-cover rounded-lg border" />
                      <span className="absolute bottom-1 inset-x-1 bg-black/55 text-white text-[10px] text-center py-0.5 rounded">{slot.label}</span>
                      <button onClick={() => { slot.set(null); setShots([]); }} className="absolute top-1 right-1 size-6 rounded-full bg-destructive text-white grid place-items-center"><X className="size-3.5" /></button>
                    </div>
                  ) : (
                    <label className="grid place-items-center gap-1 h-40 rounded-xl border-2 border-dashed cursor-pointer hover:border-primary text-muted-foreground text-xs text-center px-2">
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => readInto(e.target.files?.[0] || null, slot.set)} />
                      <Paperclip className="size-5" /> {slot.label}
                    </label>
                  )}
                </div>
              ))}
            </div>
          </div>
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
        <Button onClick={generate} disabled={busy || !ref || (dualMode && !backRef)} variant="gradient" size="lg" className="w-full">
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
