"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Globe, Loader2, Eye, Download, Copy, Save, Sparkles, X, Paperclip, ArrowRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const PAGE_TYPES = [
  { value: "product", label: "🛍️ منتج", desc: "بيع منتج محدّد" },
  { value: "service", label: "🔧 خدمة", desc: "تقديم خدمة" },
  { value: "cv", label: "📄 سيرة ذاتية", desc: "Resume / CV احترافية" },
  { value: "portfolio", label: "🎨 بورتفوليو", desc: "أعمالك السابقة" },
  { value: "event", label: "🎉 فعالية", desc: "إعلان حدث" },
  { value: "course", label: "🎓 كورس", desc: "بيع دورة تدريبية" },
  { value: "app", label: "📱 تطبيق", desc: "ترويج لتطبيق" },
  { value: "coming_soon", label: "⏳ قريباً", desc: "صفحة Pre-launch" },
];

const STYLES = [
  { value: "modern_animated", label: "🎬 عصرية متحرّكة", desc: "أنيميشن + Gradients" },
  { value: "minimalist", label: "✨ بسيطة وأنيقة", desc: "تصميم نظيف" },
  { value: "luxury", label: "💎 فاخرة", desc: "ألوان داكنة + ذهبي" },
  { value: "playful", label: "🌈 مرحة وملوّنة", desc: "ألوان جريئة" },
  { value: "corporate", label: "🏢 شركاتية", desc: "احترافي رسمي" },
];

type AttachedImage = { id: string; name: string; type: string; base64: string; previewUrl: string };
type Project = { id: string; name: string };

export default function LandingPageBuilder() {
  const [projectId, setProjectId] = useState<string>("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [pageType, setPageType] = useState("product");
  const [style, setStyle] = useState("modern_animated");
  const [title, setTitle] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [features, setFeatures] = useState("");
  const [price, setPrice] = useState("");
  const [cta, setCta] = useState("");
  const [contact, setContact] = useState("");
  const [extraNotes, setExtraNotes] = useState("");
  const [images, setImages] = useState<AttachedImage[]>([]);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [showCode, setShowCode] = useState(false);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("projects")
        .select("id, name")
        .order("updated_at", { ascending: false });
      setProjects((data as Project[]) || []);
    })();
  }, []);

  function handleFileUpload(fileList: FileList | null) {
    if (!fileList) return;
    if (images.length + fileList.length > 4) {
      toast.error("الحدّ الأقصى 4 صور");
      return;
    }
    for (const file of Array.from(fileList)) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} أكبر من 5MB`);
        continue;
      }
      if (!file.type.startsWith("image/")) continue;
      const reader = new FileReader();
      reader.onload = () => {
        const r = reader.result as string;
        const base64 = r.split(",")[1] || "";
        setImages((p) => [
          ...p,
          {
            id: `${Date.now()}-${Math.random()}`,
            name: file.name,
            type: file.type,
            base64,
            previewUrl: URL.createObjectURL(file),
          },
        ]);
      };
      reader.readAsDataURL(file);
    }
  }

  async function generate() {
    if (!title.trim()) {
      toast.error("العنوان الرئيسي مطلوب");
      return;
    }

    const pageTypeLabel = PAGE_TYPES.find((p) => p.value === pageType)?.label || pageType;
    const styleLabel = STYLES.find((s) => s.value === style)?.label || style;

    const promptParts = [
      `**نوع الصفحة**: ${pageTypeLabel}`,
      `**الستايل**: ${styleLabel}`,
      `**العنوان الرئيسي**: ${title}`,
      tagline && `**الـ Tagline / Subtitle**: ${tagline}`,
      description && `**الوصف**: ${description}`,
      features && `**المميّزات/النقاط**:\n${features}`,
      price && `**السعر**: ${price}`,
      cta && `**زرّ الإجراء (CTA)**: ${cta}`,
      contact && `**معلومات تواصل**: ${contact}`,
      extraNotes && `**ملاحظات إضافية**: ${extraNotes}`,
      images.length > 0 && `**صور مرفقة**: ${images.length} صورة (استخدمها كمراجع بصرية في وصف الـ Hero)`,
    ].filter(Boolean).join("\n");

    setLoading(true);
    setResult("");

    try {
      const res = await fetch("/api/generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: "landing_page_advanced",
          input: promptParts,
          project_id: projectId || undefined,
          attachments: images.length > 0
            ? images.map((i) => ({ type: i.type, base64: i.base64 }))
            : undefined,
        }),
      });

      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({ error: "حدثت مشكلة" }));
        toast.error(err.error ?? "حدثت مشكلة");
        setLoading(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setResult(acc);
      }
    } catch {
      toast.error("تعذّر الاتصال");
    } finally {
      setLoading(false);
    }
  }

  function extractHtml(): string {
    const m = result.match(/```html\n?([\s\S]+?)```/);
    return m ? m[1] : result;
  }

  function preview() {
    const html = extractHtml();
    if (!html.trim()) {
      toast.error("لا يوجد HTML بعد، انتظر اكتمال التوليد");
      return;
    }
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 120_000);
  }

  function download() {
    const html = extractHtml();
    if (!html.trim()) {
      toast.error("لا يوجد HTML بعد");
      return;
    }
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `landing-${title.replace(/\s+/g, "-")}-${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function copyCode() {
    navigator.clipboard.writeText(extractHtml());
    toast.success("تمّ نسخ الكود");
  }

  async function saveToLibrary() {
    if (!projectId) {
      toast.error("اختر مشروعاً لحفظ الصفحة فيه");
      return;
    }
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("deliverables").insert({
      project_id: projectId,
      user_id: user.id,
      kind: "landing_page",
      title: `Landing: ${title}`,
      content: result,
    });
    if (error) {
      toast.error("حدثت مشكلة", { description: error.message });
      return;
    }
    toast.success("اتحفظت في مكتبة المشروع 📚");
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Globe className="size-7 text-primary" />
          Landing Page Builder
        </h1>
        <p className="text-muted-foreground mt-2">
          صفحة هبوط تفاعلية بأنيميشن — لمنتج، خدمة، CV، بورتفوليو، أو أي شيء آخر
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        {/* Form */}
        <Card className="p-5 space-y-4">
          {projects.length > 0 && (
            <div>
              <Label htmlFor="proj">المشروع (يضيف سياقاً)</Label>
              <select
                id="proj"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="">— بدون مشروع —</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          )}

          <div>
            <Label>نوع الصفحة</Label>
            <div className="mt-1 grid grid-cols-2 gap-2">
              {PAGE_TYPES.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPageType(p.value)}
                  className={`p-2 rounded-md border text-right text-xs transition-all ${
                    pageType === p.value
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                      : "hover:border-primary/40"
                  }`}
                >
                  <div className="font-medium">{p.label}</div>
                  <div className="text-muted-foreground text-[10px]">{p.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label>الستايل التصميمي</Label>
            <div className="mt-1 flex flex-wrap gap-2">
              {STYLES.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setStyle(s.value)}
                  className={`px-3 py-1.5 rounded-md text-xs border ${
                    style === s.value ? "bg-primary text-primary-foreground border-primary" : ""
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="title">العنوان الرئيسي (Hero) *</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثلاً: قهوة Specialty طازجة" />
          </div>

          <div>
            <Label htmlFor="tagline">الـ Subtitle / Tagline</Label>
            <Input id="tagline" value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="من المزرعة إلى فنجانك" />
          </div>

          <div>
            <Label htmlFor="desc">الوصف</Label>
            <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="اشرح المنتج/الخدمة بالتفصيل" />
          </div>

          <div>
            <Label htmlFor="feats">المميّزات (افصل بـ Enter)</Label>
            <Textarea id="feats" value={features} onChange={(e) => setFeatures(e.target.value)} rows={4} placeholder="حبوب من إثيوبيا\nتحميص يومي\nتوصيل خلال 24 ساعة" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="price">السعر</Label>
              <Input id="price" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="299 ج.م" />
            </div>
            <div>
              <Label htmlFor="cta">نصّ زرّ CTA</Label>
              <Input id="cta" value={cta} onChange={(e) => setCta(e.target.value)} placeholder="اطلب الآن" />
            </div>
          </div>

          <div>
            <Label htmlFor="contact">معلومات تواصل / WhatsApp / Email</Label>
            <Input id="contact" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="01xxxxxxxx" />
          </div>

          <div>
            <Label>صور المنتج (اختياري، حتى 4)</Label>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {images.map((a) => (
                <div key={a.id} className="relative group size-20 rounded-lg overflow-hidden border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={a.previewUrl} alt={a.name} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setImages((p) => p.filter((x) => x.id !== a.id))}
                    className="absolute top-1 right-1 size-5 rounded-full bg-destructive text-white grid place-items-center opacity-0 group-hover:opacity-100"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ))}
              {images.length < 4 && (
                <label className="size-20 rounded-lg border-2 border-dashed grid place-items-center cursor-pointer hover:border-primary">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFileUpload(e.target.files)}
                  />
                  <Paperclip className="size-5 text-muted-foreground" />
                </label>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="extra">أي ملاحظات إضافية؟</Label>
            <Textarea id="extra" value={extraNotes} onChange={(e) => setExtraNotes(e.target.value)} rows={2} placeholder="مثلاً: لازم تكون ثنائية اللغة، استخدم خط Tajawal..." />
          </div>

          <Button onClick={generate} disabled={loading} variant="gradient" size="lg" className="w-full">
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            {loading ? "جاري التوليد... (قد يستغرق دقيقة)" : "توليد الصفحة"}
            {!loading && <ArrowRight className="size-4" />}
          </Button>
        </Card>

        {/* Output */}
        <div className="space-y-4">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4 pb-3 border-b">
              <h3 className="font-semibold flex items-center gap-2">
                <Sparkles className="size-4 text-primary" />
                صفحتك جاهزة
              </h3>
              {result && (
                <Button variant="ghost" size="sm" onClick={() => setShowCode(!showCode)}>
                  {showCode ? "عرض النصّ" : "عرض الكود"}
                </Button>
              )}
            </div>

            {!result && !loading && (
              <div className="text-center py-10 text-muted-foreground">
                <Globe className="size-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">املأ البيانات يساراً واضغط "توليد الصفحة"</p>
              </div>
            )}

            {loading && !result && (
              <div className="text-center py-10">
                <Loader2 className="size-8 mx-auto animate-spin text-primary mb-3" />
                <p className="text-sm text-muted-foreground">Oji يصمّم صفحتك...</p>
              </div>
            )}

            {result && (
              <div className="max-h-[500px] overflow-y-auto">
                {showCode ? (
                  <pre className="text-xs bg-muted/50 p-3 rounded-md whitespace-pre-wrap overflow-x-auto" dir="ltr">
                    {result}
                  </pre>
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{result.slice(0, 800)}{result.length > 800 ? "..." : ""}</p>
                )}
              </div>
            )}
          </Card>

          {result && !loading && (
            <Card className="p-4">
              <div className="grid grid-cols-2 gap-2">
                <Button variant="gradient" onClick={preview}>
                  <Eye className="size-4" /> معاينة مباشرة
                </Button>
                <Button variant="outline" onClick={download}>
                  <Download className="size-4" /> تنزيل HTML
                </Button>
                <Button variant="outline" onClick={copyCode}>
                  <Copy className="size-4" /> نسخ الكود
                </Button>
                <Button variant="outline" onClick={saveToLibrary}>
                  <Save className="size-4" /> حفظ في المكتبة
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-3 text-center">
                💡 ارفع الـ HTML على أي استضافة وستحصل على موقع حقيقي
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
