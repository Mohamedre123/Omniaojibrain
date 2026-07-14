"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Palette, Paperclip, Copy, Check, X } from "lucide-react";

export default function ColorsPage() {
  const [preview, setPreview] = useState("");
  const [colors, setColors] = useState<string[]>([]);
  const [copied, setCopied] = useState("");

  function handleFile(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("لازم صورة"); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    const img = new Image();
    img.onload = () => {
      const size = 80;
      const c = document.createElement("canvas");
      c.width = size; c.height = size;
      const ctx = c.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, size, size);
      const data = ctx.getImageData(0, 0, size, size).data;
      // تجميع الألوان (تكميم بسيط) واختيار الأكثر تكراراً
      const counts: Record<string, number> = {};
      for (let i = 0; i < data.length; i += 4) {
        const r = Math.round(data[i] / 24) * 24;
        const g = Math.round(data[i + 1] / 24) * 24;
        const b = Math.round(data[i + 2] / 24) * 24;
        const hex = "#" + [r, g, b].map((x) => Math.min(255, x).toString(16).padStart(2, "0")).join("");
        counts[hex] = (counts[hex] || 0) + 1;
      }
      const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([c]) => c);
      setColors(top);
    };
    img.src = url;
  }

  function copy(c: string) {
    navigator.clipboard.writeText(c).then(() => { setCopied(c); toast.success(`اتنسخ ${c}`); setTimeout(() => setCopied(""), 1200); });
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2"><Palette className="size-7 text-primary" /> استخراج ألوان من صورة</h1>
        <p className="text-muted-foreground mt-1 text-sm">ارفع صورة (لوجو/منتج) وهنطلّعلك لوحة ألوانها — انسخها لهوية علامتك.</p>
      </div>

      <Card className="p-5 space-y-4">
        {preview ? (
          <div className="relative w-fit">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="" className="max-h-48 rounded-lg border" />
            <button onClick={() => { setPreview(""); setColors([]); }} className="absolute top-1 right-1 size-6 rounded-full bg-destructive text-white grid place-items-center"><X className="size-3.5" /></button>
          </div>
        ) : (
          <label className="grid place-items-center gap-2 h-36 rounded-xl border-2 border-dashed cursor-pointer hover:border-primary text-muted-foreground text-sm">
            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0] || null)} />
            <Paperclip className="size-6" /> ارفع صورة
          </label>
        )}

        {colors.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {colors.map((c) => (
              <button key={c} onClick={() => copy(c)} className="rounded-lg overflow-hidden border hover-lift">
                <div className="h-16" style={{ backgroundColor: c }} />
                <div className="text-[10px] font-mono py-1 flex items-center justify-center gap-1">
                  {copied === c ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />} {c}
                </div>
              </button>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
