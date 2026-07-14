"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crop, Paperclip, Download, X } from "lucide-react";

const PRESETS = [
  { label: "بوست إنستجرام 1:1", w: 1080, h: 1080 },
  { label: "بورتريه 4:5", w: 1080, h: 1350 },
  { label: "ستوري/ريلز 9:16", w: 1080, h: 1920 },
  { label: "أفقي 16:9", w: 1920, h: 1080 },
  { label: "غلاف فيسبوك", w: 820, h: 312 },
  { label: "صورة تويتر/X", w: 1200, h: 675 },
];

export default function ResizePage() {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [preview, setPreview] = useState("");
  const [out, setOut] = useState("");

  function handleFile(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("لازم صورة"); return; }
    const url = URL.createObjectURL(file);
    setPreview(url); setOut("");
    const i = new Image();
    i.onload = () => setImg(i);
    i.src = url;
  }

  function resize(w: number, h: number) {
    if (!img) { toast.error("ارفع صورة"); return; }
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    const ctx = c.getContext("2d"); if (!ctx) return;
    // cover: املأ الإطار مع قصّ الزائد
    const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
    const dw = img.naturalWidth * scale, dh = img.naturalHeight * scale;
    ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
    setOut(c.toDataURL("image/png"));
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2"><Crop className="size-7 text-primary" /> تغيير مقاس الصورة</h1>
        <p className="text-muted-foreground mt-1 text-sm">اضبط صورتك تلقائياً لمقاس أي منصّة (قصّ ذكي يملأ الإطار).</p>
      </div>

      <Card className="p-5 space-y-4">
        {preview ? (
          <div className="relative w-fit">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="" className="max-h-40 rounded-lg border" />
            <button onClick={() => { setPreview(""); setImg(null); setOut(""); }} className="absolute top-1 right-1 size-6 rounded-full bg-destructive text-white grid place-items-center"><X className="size-3.5" /></button>
          </div>
        ) : (
          <label className="grid place-items-center gap-2 h-36 rounded-xl border-2 border-dashed cursor-pointer hover:border-primary text-muted-foreground text-sm">
            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0] || null)} />
            <Paperclip className="size-6" /> ارفع صورة
          </label>
        )}
        <div className="grid grid-cols-2 gap-2">
          {PRESETS.map((p) => (
            <Button key={p.label} onClick={() => resize(p.w, p.h)} disabled={!img} variant="outline" size="sm" className="justify-between">
              {p.label} <span className="text-[10px] text-muted-foreground">{p.w}×{p.h}</span>
            </Button>
          ))}
        </div>
      </Card>

      {out && (
        <Card className="p-5 mt-5 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={out} alt="الناتج" className="mx-auto max-h-64 rounded-lg" />
          <a href={out} download={`oji-resized-${Date.now()}.png`} className="mt-3 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"><Download className="size-4" /> تحميل</a>
        </Card>
      )}
    </div>
  );
}
