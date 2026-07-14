"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FileArchive, Paperclip, Download, X } from "lucide-react";

export default function CompressPage() {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [preview, setPreview] = useState("");
  const [origSize, setOrigSize] = useState(0);
  const [format, setFormat] = useState<"jpeg" | "webp" | "png">("jpeg");
  const [quality, setQuality] = useState(0.8);
  const [out, setOut] = useState<{ url: string; size: number } | null>(null);

  function handleFile(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("لازم صورة"); return; }
    setOrigSize(file.size);
    const url = URL.createObjectURL(file);
    setPreview(url); setOut(null);
    const i = new Image();
    i.onload = () => setImg(i);
    i.src = url;
  }

  function process() {
    if (!img) { toast.error("ارفع صورة"); return; }
    const c = document.createElement("canvas");
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    const ctx = c.getContext("2d"); if (!ctx) return;
    if (format === "jpeg") { ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height); }
    ctx.drawImage(img, 0, 0);
    c.toBlob((blob) => {
      if (!blob) return;
      setOut({ url: URL.createObjectURL(blob), size: blob.size });
    }, `image/${format}`, format === "png" ? undefined : quality);
  }

  const kb = (b: number) => (b / 1024).toFixed(0) + " KB";

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2"><FileArchive className="size-7 text-primary" /> ضغط وتحويل الصور</h1>
        <p className="text-muted-foreground mt-1 text-sm">صغّر حجم صورك وحوّلها بين JPG / WebP / PNG — على المتصفح.</p>
      </div>

      <Card className="p-5 space-y-4">
        {preview ? (
          <div className="relative w-fit">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="" className="max-h-40 rounded-lg border" />
            <button onClick={() => { setPreview(""); setImg(null); setOut(null); }} className="absolute top-1 right-1 size-6 rounded-full bg-destructive text-white grid place-items-center"><X className="size-3.5" /></button>
          </div>
        ) : (
          <label className="grid place-items-center gap-2 h-36 rounded-xl border-2 border-dashed cursor-pointer hover:border-primary text-muted-foreground text-sm">
            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0] || null)} />
            <Paperclip className="size-6" /> ارفع صورة
          </label>
        )}

        <div className="grid grid-cols-3 gap-2">
          {(["jpeg", "webp", "png"] as const).map((f) => (
            <button key={f} onClick={() => setFormat(f)} className={`py-2 rounded-md text-sm border ${format === f ? "bg-primary text-primary-foreground border-primary" : ""}`}>{f.toUpperCase()}</button>
          ))}
        </div>
        {format !== "png" && (
          <div>
            <Label>الجودة: {(quality * 100).toFixed(0)}%</Label>
            <input type="range" min={0.3} max={1} step={0.05} value={quality} onChange={(e) => setQuality(parseFloat(e.target.value))} className="w-full mt-2" />
          </div>
        )}
        <Button onClick={process} disabled={!img} variant="gradient" className="w-full">ضغط وتحويل</Button>
      </Card>

      {out && (
        <Card className="p-5 mt-5 text-center">
          <p className="text-sm text-muted-foreground mb-2">الأصل: {kb(origSize)} → الناتج: <span className="text-primary font-semibold">{kb(out.size)}</span> {origSize > 0 && `(توفير ${Math.max(0, Math.round((1 - out.size / origSize) * 100))}%)`}</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={out.url} alt="الناتج" className="mx-auto max-h-48 rounded-lg" />
          <a href={out.url} download={`oji-image.${format === "jpeg" ? "jpg" : format}`} className="mt-3 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"><Download className="size-4" /> تحميل</a>
        </Card>
      )}
    </div>
  );
}
