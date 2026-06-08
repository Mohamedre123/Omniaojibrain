"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Award, Loader2, Wand2, Download, Sparkles } from "lucide-react";

type GenImage = { mimeType: string; data: string };

export default function LogoPage() {
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [style, setStyle] = useState("minimalist");
  const [colors, setColors] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<GenImage[]>([]);

  async function generate() {
    if (!name.trim()) {
      toast.error("اسم البراند مطلوب");
      return;
    }
    setLoading(true);
    setImages([]);

    const prompt = `Professional logo design for "${name}" — ${industry || "brand"} business. Style: ${style}. ${colors ? `Color palette: ${colors}.` : ""} ${notes || ""}. Clean, modern, vector-style, on solid background, no text artifacts, suitable for a brand identity. High quality, professional logo design only.`;

    try {
      const res = await fetch("/api/image-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "تعذّر التوليد");
        return;
      }
      setImages(data.images || []);
    } catch {
      toast.error("تعذّر الاتصال");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Award className="size-7 text-primary" />
          مولّد لوجو
        </h1>
        <p className="text-muted-foreground mt-2">
          اقتراحات لوجو بـ AI — استخدمها كنقطة بداية أو إلهام لمصمّمك
        </p>
      </div>

      <Card className="p-5 space-y-4">
        <div>
          <Label htmlFor="name">اسم البراند *</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Oji Brain" />
        </div>
        <div>
          <Label htmlFor="industry">القطاع</Label>
          <Input id="industry" value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="تقنية / مطعم / موضة..." />
        </div>
        <div>
          <Label>الستايل</Label>
          <div className="mt-1 flex flex-wrap gap-2">
            {[
              { v: "minimalist", l: "✨ بسيط" },
              { v: "modern", l: "🎨 عصري" },
              { v: "geometric", l: "📐 هندسي" },
              { v: "vintage", l: "📜 كلاسيكي" },
              { v: "mascot", l: "🦊 Mascot" },
              { v: "abstract", l: "🌀 تجريدي" },
            ].map((s) => (
              <button
                key={s.v}
                onClick={() => setStyle(s.v)}
                className={`px-3 py-1.5 rounded-md text-xs border ${
                  style === s.v ? "bg-primary text-primary-foreground border-primary" : ""
                }`}
              >
                {s.l}
              </button>
            ))}
          </div>
        </div>
        <div>
          <Label htmlFor="colors">الألوان (Hex مفصولة بفاصلة)</Label>
          <Input id="colors" value={colors} onChange={(e) => setColors(e.target.value)} placeholder="#7c3aed, #d946ef" />
        </div>
        <div>
          <Label htmlFor="notes">ملاحظات إضافية</Label>
          <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="مثلاً: لازم يحتوي رمز فنجان قهوة" />
        </div>

        <Button onClick={generate} disabled={loading} variant="gradient" size="lg" className="w-full">
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />}
          {loading ? "جاري التوليد..." : "توليد اللوجو"}
        </Button>
      </Card>

      {images.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
          {images.map((img, i) => {
            const dataUrl = `data:${img.mimeType};base64,${img.data}`;
            return (
              <Card key={i} className="p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={dataUrl} alt={`Logo ${i}`} className="w-full h-auto rounded" />
                <div className="mt-2 flex justify-end">
                  <a href={dataUrl} download={`logo-${name}-${Date.now()}.png`} className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                    <Download className="size-3" /> تنزيل
                  </a>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {!loading && images.length === 0 && (
        <p className="text-center text-xs text-muted-foreground mt-4">
          💡 نموذج توليد اللوجو ممكن يحتاج تفعيل ميزة الصور في Google AI Studio
        </p>
      )}
    </div>
  );
}
