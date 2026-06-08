"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Image as ImageIcon,
  Sparkles,
  Loader2,
  Download,
  Wand2,
  Crop,
  Edit3,
  X,
  Paperclip,
  Mic,
  Film,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type GeneratedImage = { mimeType: string; data: string };

type Tab = "generate" | "edit" | "resize";

const ASPECTS = [
  { label: "مربّع 1:1 (Post)", value: "1:1", w: 1080, h: 1080 },
  { label: "Story 9:16", value: "9:16", w: 1080, h: 1920 },
  { label: "Reel 9:16", value: "9:16-reel", w: 1080, h: 1920 },
  { label: "أفقي 16:9", value: "16:9", w: 1920, h: 1080 },
  { label: "Pinterest 2:3", value: "2:3", w: 1000, h: 1500 },
  { label: "غلاف فيسبوك", value: "fb-cover", w: 820, h: 312 },
];

export default function StudioPage() {
  const [tab, setTab] = useState<Tab>("generate");

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <ImageIcon className="size-7 text-primary" />
          الاستوديو
        </h1>
        <p className="text-muted-foreground mt-2">
          توليدُ وتعديلُ وتحويلُ الصور بالذكاء الاصطناعي — استبدل اشتراكات Midjourney و Photoshop
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-3 mb-4">
        <Link href="/studio/voice-over">
          <Card className="p-4 hover:border-primary transition-all cursor-pointer flex items-center gap-3">
            <div className="size-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 grid place-items-center text-white">
              <Mic className="size-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Voice-over</h3>
              <p className="text-xs text-muted-foreground">تعليق صوتي بأيّ لهجة</p>
            </div>
          </Card>
        </Link>
        <Link href="/studio/video">
          <Card className="p-4 hover:border-primary transition-all cursor-pointer flex items-center gap-3">
            <div className="size-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 grid place-items-center text-white">
              <Film className="size-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">توليد فيديو</h3>
              <p className="text-xs text-muted-foreground">برومبتات Veo/Runway/Kling</p>
            </div>
          </Card>
        </Link>
      </div>

      <Card className="overflow-hidden">
        <div className="flex border-b">
          <button
            onClick={() => setTab("generate")}
            className={`flex-1 p-3 text-sm font-medium flex items-center justify-center gap-2 ${
              tab === "generate" ? "bg-primary/10 text-primary border-b-2 border-primary" : ""
            }`}
          >
            <Sparkles className="size-4" /> توليد صور
          </button>
          <button
            onClick={() => setTab("edit")}
            className={`flex-1 p-3 text-sm font-medium flex items-center justify-center gap-2 ${
              tab === "edit" ? "bg-primary/10 text-primary border-b-2 border-primary" : ""
            }`}
          >
            <Edit3 className="size-4" /> تعديل صور
          </button>
          <button
            onClick={() => setTab("resize")}
            className={`flex-1 p-3 text-sm font-medium flex items-center justify-center gap-2 ${
              tab === "resize" ? "bg-primary/10 text-primary border-b-2 border-primary" : ""
            }`}
          >
            <Crop className="size-4" /> تحويل أحجام
          </button>
        </div>

        <div className="p-5">
          {tab === "generate" && <GenerateTab />}
          {tab === "edit" && <EditTab />}
          {tab === "resize" && <ResizeTab />}
        </div>
      </Card>
    </div>
  );
}

// ============== GENERATE ==============
function GenerateTab() {
  const [prompt, setPrompt] = useState("");
  const [aspect, setAspect] = useState("1:1");
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [useBrand, setUseBrand] = useState(true);
  const [refImages, setRefImages] = useState<Array<{ data: string; mimeType: string; previewUrl: string; name: string }>>([]);

  function handleRefUpload(files: FileList | null) {
    if (!files) return;
    if (refImages.length + files.length > 3) {
      toast.error("الحدّ الأقصى 3 صور مرجعية");
      return;
    }
    for (const file of Array.from(files)) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} أكبر من 5MB`);
        continue;
      }
      if (!file.type.startsWith("image/")) continue;
      const reader = new FileReader();
      reader.onload = () => {
        const r = reader.result as string;
        const base64 = r.split(",")[1] || "";
        setRefImages((p) => [...p, { data: base64, mimeType: file.type, previewUrl: URL.createObjectURL(file), name: file.name }]);
      };
      reader.readAsDataURL(file);
    }
  }

  async function generate() {
    if (!prompt.trim()) {
      toast.error("اكتب الوصف أولاً");
      return;
    }
    setLoading(true);
    setImages([]);

    let brandContext = "";
    if (useBrand) {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("brand_voice, brand_name, brand_colors")
          .eq("id", user.id)
          .maybeSingle();
        if (profile) {
          const colors = (profile.brand_colors as string[]) || [];
          brandContext = [
            profile.brand_name && `Brand: ${profile.brand_name}`,
            profile.brand_voice && `Voice: ${profile.brand_voice}`,
            colors.length > 0 && `Brand colors (use exactly): ${colors.join(", ")}`,
          ].filter(Boolean).join(". ");
        }
      }
    }

    try {
      const refsNote = refImages.length > 0
        ? ` IMPORTANT: ${refImages.length} reference image(s) attached — use them as the EXACT product/subject. Keep the product identity, packaging, logo, and look 100% identical to the reference. DO NOT change the product itself, only the scene/setting around it.`
        : "";
      // 💡 اقتراحات كاميرا ذكية بناءً على نوع الموضوع
      const cameraHint = ` Camera angle suggestions: hero low-angle for impact, eye-level for product clarity, top-down flat-lay for elegance, or macro close-up for texture detail. Choose the most fitting cinematic angle.`;
      const fullPrompt = `${prompt}.${refsNote}${cameraHint} Aspect ratio: ${aspect}.`;
      const res = await fetch("/api/image-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: fullPrompt,
          brandContext: brandContext || undefined,
          aspect,
          refImages: refImages.length > 0 ? refImages.map(r => ({ mimeType: r.mimeType, data: r.data })) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "تعذّر التوليد");
        return;
      }
      setImages(data.images || []);
      toast.success(`تمّ توليد ${data.images?.length || 0} صورة`);
    } catch {
      toast.error("تعذّر الاتصال");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="prompt">صف الصورة المطلوبة</Label>
        <Textarea
          id="prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="مثلاً: كوب قهوة فوق طاولة خشبية بإضاءة دافئة..."
          rows={4}
          className="mt-1"
        />
      </div>

      <div>
        <Label>الأبعاد</Label>
        <div className="mt-1 flex flex-wrap gap-2">
          {ASPECTS.map((a) => (
            <button
              key={a.value}
              onClick={() => setAspect(a.value)}
              className={`px-3 py-1.5 rounded-md text-xs border transition-all ${
                aspect === a.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card hover:border-primary/50"
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label>صور مرجعية (اختياري — ارفع صورة منتجك ليبني عليها)</Label>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {refImages.map((r, i) => (
            <div key={i} className="relative group size-20 rounded-lg overflow-hidden border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={r.previewUrl} alt={r.name} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => setRefImages((p) => p.filter((_, idx) => idx !== i))}
                className="absolute top-1 right-1 size-5 rounded-full bg-destructive text-white grid place-items-center opacity-0 group-hover:opacity-100"
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
          {refImages.length < 3 && (
            <label className="size-20 rounded-lg border-2 border-dashed grid place-items-center cursor-pointer hover:border-primary">
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleRefUpload(e.target.files)}
              />
              <Paperclip className="size-5 text-muted-foreground" />
            </label>
          )}
        </div>
        {refImages.length > 0 && (
          <p className="text-xs text-muted-foreground mt-2">
            💡 الـ AI هيستخدم الصور دي كمرجع. اشرح في الوصف نوع التصوير اللي عايزه (مثلاً: &quot;نفس المنتج بإضاءة استوديو احترافية&quot;)
          </p>
        )}
      </div>

      <label className="flex items-center gap-2 cursor-pointer text-sm">
        <input
          type="checkbox"
          checked={useBrand}
          onChange={(e) => setUseBrand(e.target.checked)}
          className="size-4"
        />
        <span>استخدم ألوان وهوية علامتي في التوليد</span>
      </label>

      <Button onClick={generate} disabled={loading} variant="gradient" size="lg" className="w-full">
        {loading ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />}
        {loading ? "جاري التوليد... (قد يستغرق 20 ثانية)" : "توليد الصورة"}
      </Button>

      <ImageResults images={images} />
    </div>
  );
}

// ============== EDIT ==============
function EditTab() {
  const [refImage, setRefImage] = useState<{ data: string; mimeType: string; previewUrl: string } | null>(null);
  const [instruction, setInstruction] = useState("");
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<GeneratedImage[]>([]);

  function handleFile(file: File | null) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("الصورة أكبر من 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1] || "";
      setRefImage({
        data: base64,
        mimeType: file.type,
        previewUrl: URL.createObjectURL(file),
      });
    };
    reader.readAsDataURL(file);
  }

  async function edit() {
    if (!refImage) {
      toast.error("ارفع صورة أولاً");
      return;
    }
    if (!instruction.trim()) {
      toast.error("اكتب التعديل المطلوب");
      return;
    }

    setLoading(true);
    setImages([]);

    try {
      const res = await fetch("/api/image-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: instruction,
          refImages: [{ mimeType: refImage.mimeType, data: refImage.data }],
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "تعذّر التعديل");
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
    <div className="space-y-4">
      <div>
        <Label>الصورة الأصلية</Label>
        {refImage ? (
          <div className="relative inline-block mt-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={refImage.previewUrl} alt="ref" className="max-h-64 rounded-lg border" />
            <button
              onClick={() => setRefImage(null)}
              className="absolute top-2 right-2 size-7 rounded-full bg-destructive text-white grid place-items-center"
            >
              <X className="size-4" />
            </button>
          </div>
        ) : (
          <label className="mt-1 block border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0] || null)}
            />
            <Paperclip className="size-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">اضغط لرفع صورة</p>
          </label>
        )}
      </div>

      <div>
        <Label htmlFor="instr">التعديل المطلوب</Label>
        <Textarea
          id="instr"
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          placeholder="مثلاً: شيل الخلفية، غيّر اللون لأرجواني، أضف ظلاً ناعماً..."
          rows={3}
          className="mt-1"
        />
      </div>

      <Button onClick={edit} disabled={loading || !refImage} variant="gradient" size="lg" className="w-full">
        {loading ? <Loader2 className="size-4 animate-spin" /> : <Edit3 className="size-4" />}
        {loading ? "جاري التعديل..." : "تطبيق التعديل"}
      </Button>

      <ImageResults images={images} />
    </div>
  );
}

// ============== RESIZE ==============
function ResizeTab() {
  const [src, setSrc] = useState<string | null>(null);
  const [outputs, setOutputs] = useState<Array<{ label: string; url: string; w: number; h: number }>>([]);
  const [processing, setProcessing] = useState(false);

  function handleFile(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("يجب أن يكون ملفُ صورة");
      return;
    }
    setSrc(URL.createObjectURL(file));
    setOutputs([]);
  }

  async function processSizes() {
    if (!src) return;
    setProcessing(true);
    setOutputs([]);

    const img = new Image();
    img.onload = () => {
      const sizes = [
        { label: "Instagram Post", w: 1080, h: 1080 },
        { label: "Instagram Story", w: 1080, h: 1920 },
        { label: "Instagram Reel Cover", w: 1080, h: 1920 },
        { label: "Facebook Cover", w: 820, h: 312 },
        { label: "Facebook Post", w: 1200, h: 630 },
        { label: "Twitter Header", w: 1500, h: 500 },
        { label: "LinkedIn Cover", w: 1584, h: 396 },
        { label: "YouTube Thumbnail", w: 1280, h: 720 },
        { label: "Pinterest Pin", w: 1000, h: 1500 },
      ];

      const results: Array<{ label: string; url: string; w: number; h: number }> = [];

      for (const s of sizes) {
        const canvas = document.createElement("canvas");
        canvas.width = s.w;
        canvas.height = s.h;
        const ctx = canvas.getContext("2d")!;

        // Cover/crop algorithm
        const scale = Math.max(s.w / img.width, s.h / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        const x = (s.w - w) / 2;
        const y = (s.h - h) / 2;
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, s.w, s.h);
        ctx.drawImage(img, x, y, w, h);

        results.push({ label: s.label, url: canvas.toDataURL("image/png"), w: s.w, h: s.h });
      }

      setOutputs(results);
      setProcessing(false);
    };
    img.src = src;
  }

  function downloadAll() {
    for (const o of outputs) {
      const a = document.createElement("a");
      a.href = o.url;
      a.download = `${o.label.replace(/\s+/g, "-")}-${o.w}x${o.h}.png`;
      a.click();
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <Label>صورة المصدر</Label>
        {src ? (
          <div className="relative inline-block mt-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="src" className="max-h-64 rounded-lg border" />
            <button
              onClick={() => { setSrc(null); setOutputs([]); }}
              className="absolute top-2 right-2 size-7 rounded-full bg-destructive text-white grid place-items-center"
            >
              <X className="size-4" />
            </button>
          </div>
        ) : (
          <label className="mt-1 block border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0] || null)}
            />
            <Paperclip className="size-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">اضغط لرفع صورة لتحويلها لكل الأحجام</p>
          </label>
        )}
      </div>

      <Button onClick={processSizes} disabled={!src || processing} variant="gradient" size="lg" className="w-full">
        {processing ? <Loader2 className="size-4 animate-spin" /> : <Crop className="size-4" />}
        تحويل لكل الأحجام
      </Button>

      {outputs.length > 0 && (
        <>
          <div className="flex justify-between items-center">
            <p className="text-sm font-medium">{outputs.length} حجم جاهز</p>
            <Button variant="outline" size="sm" onClick={downloadAll}>
              <Download className="size-3" /> تنزيل الكلّ
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {outputs.map((o) => (
              <div key={o.label} className="border rounded-lg p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={o.url} alt={o.label} className="w-full h-auto rounded" />
                <div className="mt-2 text-xs flex justify-between items-center">
                  <span>{o.label}<br /><span className="text-muted-foreground">{o.w}×{o.h}</span></span>
                  <a href={o.url} download={`${o.label.replace(/\s+/g, "-")}.png`} className="text-primary">
                    <Download className="size-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ============== Reusable Image Results ==============
function ImageResults({ images }: { images: GeneratedImage[] }) {
  if (images.length === 0) return null;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
      {images.map((img, i) => {
        const dataUrl = `data:${img.mimeType};base64,${img.data}`;
        return (
          <div key={i} className="border rounded-lg overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={dataUrl} alt={`Generated ${i}`} className="w-full h-auto" />
            <div className="p-2 flex justify-end">
              <a
                href={dataUrl}
                download={`oji-${Date.now()}.png`}
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
              >
                <Download className="size-3" /> تنزيل
              </a>
            </div>
          </div>
        );
      })}
    </div>
  );
}
