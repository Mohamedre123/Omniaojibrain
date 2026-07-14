"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Stamp, Download } from "lucide-react";

const POSITIONS = [
  { label: "↖️", v: "tl" }, { label: "↗️", v: "tr" }, { label: "↙️", v: "bl" }, { label: "↘️", v: "br" }, { label: "⏺️ الوسط", v: "c" },
];

export default function WatermarkPage() {
  const [base, setBase] = useState<HTMLImageElement | null>(null);
  const [logo, setLogo] = useState<HTMLImageElement | null>(null);
  const [pos, setPos] = useState("br");
  const [size, setSize] = useState(0.2);
  const [opacity, setOpacity] = useState(0.85);
  const [out, setOut] = useState("");

  function load(file: File | null, set: (i: HTMLImageElement) => void) {
    if (!file || !file.type.startsWith("image/")) { toast.error("لازم صورة"); return; }
    const i = new Image();
    i.onload = () => set(i);
    i.src = URL.createObjectURL(file);
  }

  function apply() {
    if (!base || !logo) { toast.error("ارفع الصورة واللوجو"); return; }
    const c = document.createElement("canvas");
    c.width = base.naturalWidth; c.height = base.naturalHeight;
    const ctx = c.getContext("2d"); if (!ctx) return;
    ctx.drawImage(base, 0, 0);
    const lw = c.width * size;
    const lh = lw * (logo.naturalHeight / logo.naturalWidth);
    const m = c.width * 0.03;
    let x = m, y = m;
    if (pos === "tr") { x = c.width - lw - m; y = m; }
    else if (pos === "bl") { x = m; y = c.height - lh - m; }
    else if (pos === "br") { x = c.width - lw - m; y = c.height - lh - m; }
    else if (pos === "c") { x = (c.width - lw) / 2; y = (c.height - lh) / 2; }
    ctx.globalAlpha = opacity;
    ctx.drawImage(logo, x, y, lw, lh);
    ctx.globalAlpha = 1;
    setOut(c.toDataURL("image/png"));
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2"><Stamp className="size-7 text-primary" /> علامة مائية / لوجو</h1>
        <p className="text-muted-foreground mt-1 text-sm">حطّ لوجو أو علامة مائية على صورك — على المتصفح.</p>
      </div>

      <Card className="p-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">الصورة الأساسية</Label>
            <label className="mt-1 grid place-items-center h-24 rounded-lg border-2 border-dashed cursor-pointer hover:border-primary text-xs text-muted-foreground">
              <input type="file" accept="image/*" className="hidden" onChange={(e) => load(e.target.files?.[0] || null, setBase)} />
              {base ? "✅ اتحمّلت" : "ارفع الصورة"}
            </label>
          </div>
          <div>
            <Label className="text-xs">اللوجو (PNG شفاف أفضل)</Label>
            <label className="mt-1 grid place-items-center h-24 rounded-lg border-2 border-dashed cursor-pointer hover:border-primary text-xs text-muted-foreground">
              <input type="file" accept="image/*" className="hidden" onChange={(e) => load(e.target.files?.[0] || null, setLogo)} />
              {logo ? "✅ اتحمّل" : "ارفع اللوجو"}
            </label>
          </div>
        </div>

        <div>
          <Label className="text-xs">المكان</Label>
          <div className="mt-1 flex flex-wrap gap-2">
            {POSITIONS.map((p) => (
              <button key={p.v} onClick={() => setPos(p.v)} className={`px-3 py-1.5 rounded-md text-sm border ${pos === p.v ? "bg-primary text-primary-foreground border-primary" : ""}`}>{p.label}</button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label className="text-xs">الحجم: {(size * 100).toFixed(0)}%</Label><input type="range" min={0.08} max={0.5} step={0.02} value={size} onChange={(e) => setSize(parseFloat(e.target.value))} className="w-full mt-1" /></div>
          <div><Label className="text-xs">الشفافية: {(opacity * 100).toFixed(0)}%</Label><input type="range" min={0.2} max={1} step={0.05} value={opacity} onChange={(e) => setOpacity(parseFloat(e.target.value))} className="w-full mt-1" /></div>
        </div>
        <Button onClick={apply} disabled={!base || !logo} variant="gradient" className="w-full">طبّق العلامة</Button>
      </Card>

      {out && (
        <Card className="p-5 mt-5 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={out} alt="الناتج" className="mx-auto max-h-72 rounded-lg" />
          <a href={out} download={`oji-watermarked-${Date.now()}.png`} className="mt-3 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"><Download className="size-4" /> تحميل</a>
        </Card>
      )}
    </div>
  );
}
