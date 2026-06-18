"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Globe, Loader2, Eye, Download, Copy, Save, Sparkles, X, Paperclip,
  Wand2, Code, Pencil, ArrowLeft, MonitorSmartphone, Smartphone, Tablet, RotateCw,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const PAGE_TYPES = [
  { value: "product", label: "🛍️ منتج", desc: "بيع منتج" },
  { value: "service", label: "🔧 خدمة", desc: "خدمة احترافية" },
  { value: "cv", label: "📄 سيرة ذاتية", desc: "CV / Resume" },
  { value: "portfolio", label: "🎨 بورتفوليو", desc: "أعمالك السابقة" },
  { value: "event", label: "🎉 فعالية", desc: "إعلان حدث" },
  { value: "course", label: "🎓 كورس", desc: "دورة تدريبية" },
  { value: "app", label: "📱 تطبيق", desc: "ترويج تطبيق" },
  { value: "coming_soon", label: "⏳ قريباً", desc: "Pre-launch" },
];

const STYLES = [
  { value: "modern_animated", label: "🎬 عصرية متحرّكة" },
  { value: "minimalist", label: "✨ بسيطة وأنيقة" },
  { value: "luxury", label: "💎 فاخرة" },
  { value: "playful", label: "🌈 مرحة وملوّنة" },
  { value: "corporate", label: "🏢 شركاتية" },
];

const CURRENCIES = [
  { value: "SAR", label: "🇸🇦 ريال سعودي (ر.س)" },
  { value: "AED", label: "🇦🇪 درهم إماراتي (د.إ)" },
  { value: "EGP", label: "🇪🇬 جنيه مصري (ج.م)" },
  { value: "KWD", label: "🇰🇼 دينار كويتي (د.ك)" },
  { value: "QAR", label: "🇶🇦 ريال قطري (ر.ق)" },
  { value: "BHD", label: "🇧🇭 دينار بحريني (د.ب)" },
  { value: "OMR", label: "🇴🇲 ريال عُماني (ر.ع)" },
  { value: "JOD", label: "🇯🇴 دينار أردني (د.أ)" },
  { value: "MAD", label: "🇲🇦 درهم مغربي (د.م)" },
  { value: "TND", label: "🇹🇳 دينار تونسي (د.ت)" },
  { value: "DZD", label: "🇩🇿 دينار جزائري (د.ج)" },
  { value: "IQD", label: "🇮🇶 دينار عراقي (د.ع)" },
  { value: "USD", label: "🇺🇸 دولار ($)" },
  { value: "EUR", label: "🇪🇺 يورو (€)" },
];

const CLAUDE_MODELS = [
  { id: "claude-opus-4-8", label: "Claude Opus 4.8 (الأقوى)" },
  { id: "claude-opus-4-7", label: "Claude Opus 4.7" },
  { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6 (متوازن)" },
  { id: "claude-haiku-4-5", label: "Claude Haiku 4.5 (الأسرع)" },
];

// سكربت المحرّر المرئي — يُحقن داخل المعاينة عشان النقر بالماوس + التعديل المباشر
const EDITOR_SCRIPT = `<script data-oji-editor="1">(function(){
  var counter=0, cur=null;
  var style=document.createElement('style'); style.setAttribute('data-oji-editor','1');
  style.textContent='[data-oji-hover]{outline:2px dashed #7c3aed !important;outline-offset:1px;cursor:pointer}[data-oji-selected]{outline:3px solid #7c3aed !important;outline-offset:1px}';
  document.head.appendChild(style);
  function info(el){return {id:el.getAttribute('data-oji-id'),tag:el.tagName.toLowerCase(),text:el.children.length===0?el.textContent:null,isImg:el.tagName.toLowerCase()==='img',html:el.outerHTML};}
  document.addEventListener('mouseover',function(e){var t=e.target; if(t===document.body||t===document.documentElement||!t.setAttribute)return; t.setAttribute('data-oji-hover','1');},true);
  document.addEventListener('mouseout',function(e){if(e.target&&e.target.removeAttribute)e.target.removeAttribute('data-oji-hover');},true);
  document.addEventListener('click',function(e){
    var t=e.target; if(t===document.body||t===document.documentElement)return;
    e.preventDefault(); e.stopPropagation();
    if(cur)cur.removeAttribute('data-oji-selected');
    if(!t.getAttribute('data-oji-id'))t.setAttribute('data-oji-id','oji'+(++counter));
    t.setAttribute('data-oji-selected','1'); cur=t;
    parent.postMessage({source:'oji-editor',type:'select',el:info(t)},'*');
  },true);
  window.addEventListener('message',function(e){
    var d=e.data||{}; if(d.source!=='oji-parent')return;
    if(d.type==='update'){var el=document.querySelector('[data-oji-id="'+d.id+'"]'); if(!el)return;
      if(d.prop==='text')el.textContent=d.value;
      else if(d.prop==='color')el.style.color=d.value;
      else if(d.prop==='bg')el.style.backgroundColor=d.value;
      else if(d.prop==='src')el.setAttribute('src',d.value);
      else if(d.prop==='outerHTML'){try{el.outerHTML=d.value;}catch(x){}}
    } else if(d.type==='getHtml'){
      var clone=document.documentElement.cloneNode(true);
      clone.querySelectorAll('[data-oji-editor]').forEach(function(n){n.remove()});
      clone.querySelectorAll('[data-oji-id]').forEach(function(n){n.removeAttribute('data-oji-id');n.removeAttribute('data-oji-hover');n.removeAttribute('data-oji-selected')});
      parent.postMessage({source:'oji-editor',type:'html',html:'<!DOCTYPE html>'+clone.outerHTML},'*');
    }
  });
})();<\/script>`;

type SelectedEl = { id: string; tag: string; text: string | null; isImg: boolean; html: string };

type AttachedImage = { id: string; name: string; type: string; base64: string; previewUrl: string };
type Project = { id: string; name: string };
type Step = "form" | "result";
type ViewMode = "desktop" | "tablet" | "mobile";

export default function LandingPageBuilder() {
  const [step, setStep] = useState<Step>("form");
  const [projectId, setProjectId] = useState<string>("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [pageType, setPageType] = useState("product");
  const [model, setModel] = useState("claude-opus-4-8");
  const [style, setStyle] = useState("modern_animated");
  const [title, setTitle] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [features, setFeatures] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("SAR");
  const [cta, setCta] = useState("");
  const [contact, setContact] = useState("");
  const [extraNotes, setExtraNotes] = useState("");
  const [images, setImages] = useState<AttachedImage[]>([]);

  const [loading, setLoading] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [result, setResult] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("desktop");
  const [showCodeMode, setShowCodeMode] = useState<"preview" | "code" | "edit" | "visual">("preview");
  const [editingHtml, setEditingHtml] = useState("");
  const [editInstruction, setEditInstruction] = useState("");
  const [editing, setEditing] = useState(false);
  const [selectedEl, setSelectedEl] = useState<SelectedEl | null>(null);
  const [elAi, setElAi] = useState("");
  const [elAiLoading, setElAiLoading] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const visualIframeRef = useRef<HTMLIFrameElement>(null);

  // استقبال رسائل المحرّر المرئي من داخل المعاينة
  useEffect(() => {
    function onMsg(e: MessageEvent) {
      const d = e.data || {};
      if (d.source !== "oji-editor") return;
      if (d.type === "select") setSelectedEl(d.el as SelectedEl);
      else if (d.type === "html" && typeof d.html === "string") {
        setResult("```html\n" + d.html + "\n```");
        setEditingHtml(d.html);
        toast.success("اتحفظت التعديلات المرئية ✨");
      }
    }
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  function postToVisual(prop: string, value: string) {
    if (!selectedEl) return;
    visualIframeRef.current?.contentWindow?.postMessage({ source: "oji-parent", type: "update", id: selectedEl.id, prop, value }, "*");
  }

  function saveVisualEdits() {
    visualIframeRef.current?.contentWindow?.postMessage({ source: "oji-parent", type: "getHtml" }, "*");
  }

  function replaceSelectedImage(file: File | null) {
    if (!file || !selectedEl?.isImg) return;
    if (!file.type.startsWith("image/")) { toast.error("الملف لازم صورة"); return; }
    const reader = new FileReader();
    reader.onload = () => postToVisual("src", reader.result as string);
    reader.readAsDataURL(file);
  }

  async function aiEditSelected() {
    if (!selectedEl || !elAi.trim()) { toast.error("اختر عنصراً واكتب التعديل"); return; }
    setElAiLoading(true);
    try {
      const cleanHtml = selectedEl.html.replace(/\s*data-oji-(id|hover|selected)="[^"]*"/g, "");
      const prompt = `هذا عنصر HTML واحد من صفحة:\n\n\`\`\`html\n${cleanHtml}\n\`\`\`\n\n**التعديل المطلوب**: ${elAi}\n\nأعد فقط كود هذا العنصر بعد التعديل (نفس الوسم الجذر)، بدون أي شرح، يبدأ مباشرةً بـ \`\`\`html ثم الكود ثم \`\`\`.`;
      const res = await fetch("/api/generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool: "landing_page_advanced", input: prompt, provider: "claude", model }),
      });
      if (!res.ok || !res.body) { toast.error("تعذّر التعديل"); return; }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) { const { value, done } = await reader.read(); if (done) break; acc += decoder.decode(value, { stream: true }); }
      const newHtml = extractHtml(acc);
      if (newHtml) { postToVisual("outerHTML", newHtml); setElAi(""); setSelectedEl(null); toast.success("عدّل العنصر ✨"); }
      else toast.error("لم يرجع كود صالح");
    } catch {
      toast.error("تعذّر الاتصال");
    } finally {
      setElAiLoading(false);
    }
  }

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

  // استبدل النصوص النائبة بالصور الفعلية (Data URI) عشان تظهر فعلاً
  function injectImages(html: string): string {
    let out = html;
    images.forEach((img, i) => {
      const dataUri = `data:${img.type};base64,${img.base64}`;
      out = out.split(`__IMAGE_${i + 1}__`).join(dataUri);
    });
    return out;
  }

  function extractHtml(text: string): string {
    if (!text) return "";
    // جرب استخراج من ```html block
    const m = text.match(/```html\n?([\s\S]+?)```/);
    if (m) return m[1].trim();
    // جرب أي ``` block
    const m2 = text.match(/```\n?([\s\S]+?)```/);
    if (m2) return m2[1].trim();
    // لو النص فيه <!DOCTYPE أو <html بشكل مباشر، استخدمه كله
    if (/<!DOCTYPE html|<html/i.test(text)) {
      const start = text.search(/<!DOCTYPE html|<html/i);
      const end = text.lastIndexOf("</html>");
      if (end > start) return text.slice(start, end + 7).trim();
      return text.slice(start).trim();
    }
    return text.trim();
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
      `**الستايل المطلوب**: ${styleLabel}`,
      `**العنوان الرئيسي (Hero H1)**: ${title}`,
      tagline && `**الـ Tagline / Subtitle**: ${tagline}`,
      description && `**الوصف الكامل**: ${description}`,
      features && `**المميّزات (نقطة لكل سطر)**:\n${features}`,
      price && `**السعر**: ${price} ${CURRENCIES.find(c => c.value === currency)?.label.split(" ")[1] || currency}`,
      price && `**العملة**: ${currency} (استخدم رمز العملة الصحيح بجانب السعر — مثلاً: ${price} ${currency === "SAR" ? "ر.س" : currency === "AED" ? "د.إ" : currency === "EGP" ? "ج.م" : currency})`,
      cta && `**زرّ الإجراء (CTA Text)**: ${cta}`,
      contact && `**معلومات تواصل / لينك زرّ CTA**: ${contact}`,
      extraNotes && `**ملاحظات إضافية**: ${extraNotes}`,
      images.length > 0 && `**الصور المرفقة**: ${images.length} صورة. ضع كل صورة فعلياً في الصفحة عبر وسم <img>، مستخدماً النصوص النائبة بالترتيب: ${images.map((_, i) => `__IMAGE_${i + 1}__`).join("، ")} داخل خاصية src — مثال: <img src="__IMAGE_1__" alt="المنتج" style="width:100%;border-radius:12px">. لا تستخدم روابط خارجية للصور المرفقة، واستعملها في الأماكن المناسبة (Hero، المعرض، البطاقات).`,
    ].filter(Boolean).join("\n");

    setLoading(true);
    setResult("");
    setStreamText("");
    setStep("result");

    try {
      const res = await fetch("/api/generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: "landing_page_advanced",
          input: promptParts,
          project_id: projectId || undefined,
          provider: "claude",
          model,
          attachments: images.length > 0
            ? images.map((i) => ({ type: i.type, base64: i.base64 }))
            : undefined,
        }),
      });

      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({ error: "حدثت مشكلة" }));
        toast.error(err.error ?? "حدثت مشكلة");
        setLoading(false);
        setStep("form");
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setStreamText(acc);
      }

      setResult(acc);
      setEditingHtml(extractHtml(acc));
      toast.success("تمّ توليد الصفحة! 🎉");
    } catch {
      toast.error("تعذّر الاتصال");
    } finally {
      setLoading(false);
    }
  }

  async function editWithAI() {
    if (!editInstruction.trim()) {
      toast.error("اكتب التعديل المطلوب");
      return;
    }
    if (!result) return;

    setEditing(true);

    try {
      const currentHtml = extractHtml(result);
      const editPrompt = `هذا هو الـ HTML الحالي للصفحة:

\`\`\`html
${currentHtml}
\`\`\`

**التعديل المطلوب من العميل**: ${editInstruction}

أعد كامل الـ HTML المعدّل بنفس الجودة. حافظ على هيكل الصفحة ولا تشيل أيّ Sections إلا لو طُلب صراحةً. ابدأ بـ \`\`\`html مباشرةً.`;

      const res = await fetch("/api/generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: "landing_page_advanced",
          input: editPrompt,
          project_id: projectId || undefined,
          provider: "claude",
          model,
        }),
      });

      if (!res.ok || !res.body) {
        toast.error("تعذّر التعديل");
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setStreamText(acc);
      }

      setResult(acc);
      setEditingHtml(extractHtml(acc));
      setEditInstruction("");
      toast.success("تمّ التعديل ✨");
    } catch {
      toast.error("تعذّر التعديل");
    } finally {
      setEditing(false);
    }
  }

  function applyManualEdit() {
    if (!editingHtml.trim()) return;
    const newResult = `\`\`\`html\n${editingHtml}\n\`\`\``;
    setResult(newResult);
    setShowCodeMode("preview");
    toast.success("تمّ تطبيق التعديل اليدوي");
    // Reload iframe
    setTimeout(() => {
      if (iframeRef.current) {
        iframeRef.current.srcdoc = editingHtml;
      }
    }, 100);
  }

  function previewInNewTab() {
    const html = injectImages(extractHtml(result));
    if (!html.trim()) { toast.error("لا يوجد HTML بعد"); return; }
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 120_000);
  }

  function download() {
    const html = injectImages(extractHtml(result));
    if (!html.trim()) { toast.error("لا يوجد HTML بعد"); return; }
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `landing-${title.replace(/\s+/g, "-") || "page"}-${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("تمّ التنزيل");
  }

  function copyCode() {
    navigator.clipboard.writeText(injectImages(extractHtml(result)));
    toast.success("تمّ نسخ الكود");
  }

  async function saveToLibrary() {
    if (!projectId) { toast.error("اختر مشروعاً للحفظ"); return; }
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
    toast.success("اتحفظت في المكتبة 📚");
  }

  const viewWidth = viewMode === "mobile" ? 375 : viewMode === "tablet" ? 768 : "100%";

  // ============== Result Step ==============
  if (step === "result") {
    const htmlContent = injectImages(extractHtml(result || streamText));
    const hasContent = htmlContent.length > 20;

    return (
      <div className="min-h-screen bg-muted/30">
        <div className="border-b bg-card sticky top-16 z-20">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => setStep("form")}>
                <ArrowLeft className="size-4" /> العودة للنموذج
              </Button>
              <div className="hidden md:block w-px h-6 bg-border" />
              <div>
                <h2 className="font-semibold text-sm">{title || "Landing Page"}</h2>
                <p className="text-xs text-muted-foreground">{loading ? "جاري التوليد..." : "جاهزة"}</p>
              </div>
            </div>

            {!loading && hasContent && (
              <div className="flex flex-wrap items-center gap-1.5">
                {/* View mode */}
                <div className="flex border rounded-md overflow-hidden">
                  <button
                    onClick={() => setViewMode("desktop")}
                    className={`px-2 py-1.5 text-xs ${viewMode === "desktop" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                    title="Desktop"
                  >
                    <MonitorSmartphone className="size-3.5" />
                  </button>
                  <button
                    onClick={() => setViewMode("tablet")}
                    className={`px-2 py-1.5 text-xs ${viewMode === "tablet" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                    title="Tablet"
                  >
                    <Tablet className="size-3.5" />
                  </button>
                  <button
                    onClick={() => setViewMode("mobile")}
                    className={`px-2 py-1.5 text-xs ${viewMode === "mobile" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                    title="Mobile"
                  >
                    <Smartphone className="size-3.5" />
                  </button>
                </div>

                {/* Mode toggle */}
                <div className="flex border rounded-md overflow-hidden">
                  <button
                    onClick={() => setShowCodeMode("preview")}
                    className={`px-3 py-1.5 text-xs flex items-center gap-1 ${showCodeMode === "preview" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                  >
                    <Eye className="size-3" /> معاينة
                  </button>
                  <button
                    onClick={() => setShowCodeMode("code")}
                    className={`px-3 py-1.5 text-xs flex items-center gap-1 ${showCodeMode === "code" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                  >
                    <Code className="size-3" /> كود
                  </button>
                  <button
                    onClick={() => { setShowCodeMode("visual"); setSelectedEl(null); }}
                    className={`px-3 py-1.5 text-xs flex items-center gap-1 ${showCodeMode === "visual" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                  >
                    <Pencil className="size-3" /> تحرير مرئي
                  </button>
                  <button
                    onClick={() => setShowCodeMode("edit")}
                    className={`px-3 py-1.5 text-xs flex items-center gap-1 ${showCodeMode === "edit" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                  >
                    <Code className="size-3" /> كود/AI
                  </button>
                </div>

                <Button variant="outline" size="sm" onClick={previewInNewTab} title="فتح في تاب جديد">
                  <Eye className="size-3" />
                </Button>
                <Button variant="outline" size="sm" onClick={copyCode}>
                  <Copy className="size-3" />
                </Button>
                <Button variant="outline" size="sm" onClick={download}>
                  <Download className="size-3" />
                </Button>
                {projectId && (
                  <Button variant="gradient" size="sm" onClick={saveToLibrary}>
                    <Save className="size-3" /> حفظ
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="container mx-auto px-4 py-6">
          {loading && (
            <div className="space-y-4">
              <Card className="p-12 text-center">
                <Loader2 className="size-12 mx-auto animate-spin text-primary mb-4" />
                <h3 className="font-semibold">Oji يصمّم صفحتك...</h3>
                <p className="text-sm text-muted-foreground mt-1">قد يستغرق 30-60 ثانية</p>
                {streamText.length > 100 && (
                  <div className="mt-6 text-right">
                    <p className="text-xs text-muted-foreground mb-2">جاري التوليد ({streamText.length} حرف)...</p>
                    <pre className="text-[10px] bg-muted/50 p-3 rounded-md overflow-x-auto max-h-48 text-left" dir="ltr">
                      {streamText.slice(-500)}
                    </pre>
                  </div>
                )}
              </Card>
            </div>
          )}

          {!loading && hasContent && showCodeMode === "preview" && (
            <div className="flex justify-center">
              <div
                className="border-2 rounded-xl overflow-hidden bg-white shadow-2xl transition-all"
                style={{
                  width: viewWidth,
                  maxWidth: "100%",
                  height: "calc(100vh - 220px)",
                  minHeight: 500,
                }}
              >
                <iframe
                  ref={iframeRef}
                  srcDoc={htmlContent}
                  className="w-full h-full"
                  sandbox="allow-scripts allow-popups allow-forms allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation allow-same-origin"
                  title="Preview"
                />
              </div>
            </div>
          )}

          {!loading && hasContent && showCodeMode === "visual" && (
            <div className="grid lg:grid-cols-[1fr_320px] gap-4">
              <div className="border-2 rounded-xl overflow-hidden bg-white shadow-xl" style={{ height: "calc(100vh - 240px)", minHeight: 480 }}>
                <iframe
                  ref={visualIframeRef}
                  srcDoc={injectImages(extractHtml(result)) + EDITOR_SCRIPT}
                  className="w-full h-full"
                  sandbox="allow-scripts allow-same-origin allow-forms"
                  title="Visual Editor"
                />
              </div>

              <Card className="p-4 space-y-3 h-fit lg:sticky lg:top-32">
                <div className="flex items-center justify-between">
                  <Label className="font-semibold flex items-center gap-1.5"><Pencil className="size-4 text-primary" /> تحرير مرئي</Label>
                  <Button size="sm" variant="gradient" onClick={saveVisualEdits}><Save className="size-3" /> حفظ</Button>
                </div>

                {!selectedEl ? (
                  <p className="text-xs text-muted-foreground leading-relaxed border-2 border-dashed rounded-lg p-3">
                    🖱️ دوس بالماوس على أي جزء في الصفحة (نص، زر، صورة) عشان تختاره وتعدّله — اللون، الكلام، الصورة، وكل حاجة.
                  </p>
                ) : (
                  <div className="space-y-3">
                    <div className="text-xs text-muted-foreground">العنصر المحدّد: <span className="font-mono bg-muted px-1.5 py-0.5 rounded">{selectedEl.tag}</span></div>

                    {selectedEl.text !== null && (
                      <div>
                        <Label className="text-xs">النص</Label>
                        <Textarea
                          defaultValue={selectedEl.text}
                          onChange={(e) => postToVisual("text", e.target.value)}
                          rows={3}
                          className="mt-1 text-sm"
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">لون النص</Label>
                        <input type="color" onChange={(e) => postToVisual("color", e.target.value)} className="mt-1 w-full h-9 rounded border cursor-pointer" />
                      </div>
                      <div>
                        <Label className="text-xs">لون الخلفية</Label>
                        <input type="color" onChange={(e) => postToVisual("bg", e.target.value)} className="mt-1 w-full h-9 rounded border cursor-pointer" />
                      </div>
                    </div>

                    {selectedEl.isImg && (
                      <div>
                        <Label className="text-xs">استبدال الصورة</Label>
                        <label className="mt-1 flex items-center gap-2 rounded-lg border-2 border-dashed p-2 cursor-pointer hover:border-primary text-xs">
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => replaceSelectedImage(e.target.files?.[0] || null)} />
                          <Paperclip className="size-4" /> ارفع صورة جديدة
                        </label>
                      </div>
                    )}

                    <div className="border-t pt-3">
                      <Label className="text-xs flex items-center gap-1"><Wand2 className="size-3 text-primary" /> عدّل العنصر بالـ AI</Label>
                      <Textarea
                        value={elAi}
                        onChange={(e) => setElAi(e.target.value)}
                        placeholder="مثال: خليه أكبر وبخلفية متدرّجة، أو غيّر الأيقونة"
                        rows={2}
                        className="mt-1 text-sm"
                      />
                      <Button size="sm" variant="gradient" className="w-full mt-2" onClick={aiEditSelected} disabled={elAiLoading || !elAi.trim()}>
                        {elAiLoading ? <Loader2 className="size-3 animate-spin" /> : <Sparkles className="size-3" />}
                        {elAiLoading ? "Oji يعدّل..." : "عدّل ده بالـ AI"}
                      </Button>
                    </div>

                    <Button size="sm" variant="ghost" className="w-full text-xs" onClick={() => setSelectedEl(null)}>إلغاء التحديد</Button>
                  </div>
                )}
                <p className="text-[10px] text-muted-foreground border-t pt-2">💡 بعد ما تخلص تعديل اضغط «حفظ» عشان تثبّت التغييرات وتقدر تنزّلها.</p>
              </Card>
            </div>
          )}

          {!loading && hasContent && showCodeMode === "code" && (
            <Card className="p-4">
              <pre className="text-xs bg-muted/50 p-4 rounded-md whitespace-pre-wrap overflow-x-auto max-h-[calc(100vh-280px)] overflow-y-auto" dir="ltr">
                {htmlContent}
              </pre>
            </Card>
          )}

          {!loading && hasContent && showCodeMode === "edit" && (
            <div className="grid lg:grid-cols-[2fr_1fr] gap-4">
              <Card className="p-4">
                <Label className="mb-2 block">تعديل الـ HTML يدوياً</Label>
                <Textarea
                  value={editingHtml}
                  onChange={(e) => setEditingHtml(e.target.value)}
                  className="font-mono text-xs"
                  rows={25}
                  dir="ltr"
                />
                <div className="flex gap-2 mt-3">
                  <Button onClick={applyManualEdit} variant="gradient">
                    <RotateCw className="size-3" /> تطبيق التعديل
                  </Button>
                  <Button variant="outline" onClick={() => setEditingHtml(extractHtml(result))}>
                    إعادة للأصل
                  </Button>
                </div>
              </Card>

              <Card className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Wand2 className="size-4 text-primary" />
                  <Label className="font-semibold">عدّل بالـ AI</Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  اكتب التعديل بكلامك وOji سيعدّل الصفحة
                </p>
                <Textarea
                  value={editInstruction}
                  onChange={(e) => setEditInstruction(e.target.value)}
                  placeholder="مثال:&#10;- غيّر اللون الأساسي لأخضر&#10;- ضيف قسم شهادات عملاء&#10;- خلي العنوان أكبر&#10;- ضيف زر واتساب عائم"
                  rows={6}
                />
                <Button
                  onClick={editWithAI}
                  disabled={editing || !editInstruction.trim()}
                  variant="gradient"
                  className="w-full"
                >
                  {editing ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                  {editing ? "Oji يعدّل..." : "عدّل بالـ AI"}
                </Button>

                <div className="border-t pt-3">
                  <p className="text-xs font-semibold mb-2">أفكار سريعة:</p>
                  <div className="flex flex-wrap gap-1">
                    {[
                      "غيّر اللون لذهبي",
                      "ضيف قسم شهادات",
                      "ضيف زر واتساب عائم",
                      "خلّيه أكثر متعة",
                      "اجعله أبسط",
                      "ضيف عدّاد عرض",
                    ].map((s) => (
                      <button
                        key={s}
                        onClick={() => setEditInstruction((p) => (p ? `${p}\n${s}` : s))}
                        className="text-[10px] px-2 py-1 rounded-full border hover:bg-muted"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ============== Form Step ==============
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Globe className="size-7 text-primary" />
          Landing Page Builder
        </h1>
        <p className="text-muted-foreground mt-2">
          صفحة هبوط تفاعلية بأنيميشن — لمنتج، خدمة، CV، بورتفوليو، أو أيّ شيء آخر
        </p>
      </div>

      <Card className="p-5 space-y-5">
        {projects.length > 0 && (
          <div>
            <Label htmlFor="proj">المشروع (لإضافة سياق العلامة)</Label>
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
          <Label className="mb-2 block">نوع الصفحة</Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {PAGE_TYPES.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setPageType(p.value)}
                className={`p-3 rounded-md border text-center transition-all ${
                  pageType === p.value
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "hover:border-primary/40"
                }`}
              >
                <div className="text-xl mb-1">{p.label.split(" ")[0]}</div>
                <div className="font-medium text-xs">{p.label.split(" ").slice(1).join(" ")}</div>
                <div className="text-[10px] text-muted-foreground">{p.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label className="mb-2 block">الستايل التصميمي</Label>
          <div className="flex flex-wrap gap-2">
            {STYLES.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setStyle(s.value)}
                className={`px-3 py-2 rounded-md text-sm border transition-all ${
                  style === s.value ? "bg-primary text-primary-foreground border-primary" : "hover:border-primary/40"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label htmlFor="ai-model">موديل الذكاء الاصطناعي (البرمجة بـ Claude)</Label>
          <select
            id="ai-model"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
          >
            {CLAUDE_MODELS.map((m) => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground mt-1">صفحات الهبوط والبرمجة تُولّد بـ Claude — اختر الموديل الأقوى أو الأسرع حسب رغبتك.</p>
        </div>

        <div>
          <Label htmlFor="title">العنوان الرئيسي (Hero) <span className="text-destructive">*</span></Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثلاً: قهوة Specialty طازجة" className="mt-1" />
        </div>

        <div>
          <Label htmlFor="tagline">الـ Subtitle / Tagline</Label>
          <Input id="tagline" value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="من المزرعة إلى فنجانك" className="mt-1" />
        </div>

        <div>
          <Label htmlFor="desc">الوصف</Label>
          <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="اشرح المنتج/الخدمة بالتفصيل" className="mt-1" />
        </div>

        <div>
          <Label htmlFor="feats">المميّزات (نقطة لكل سطر)</Label>
          <Textarea
            id="feats"
            value={features}
            onChange={(e) => setFeatures(e.target.value)}
            rows={4}
            placeholder={"حبوب من إثيوبيا\nتحميص يومي\nتوصيل خلال 24 ساعة"}
            className="mt-1"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <Label htmlFor="price">السعر (اختياري)</Label>
            <Input id="price" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="299" className="mt-1" />
          </div>
          <div>
            <Label htmlFor="currency">العملة</Label>
            <select
              id="currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
            >
              {CURRENCIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="cta">نصّ زرّ CTA</Label>
            <Input id="cta" value={cta} onChange={(e) => setCta(e.target.value)} placeholder="اطلب الآن" className="mt-1" />
          </div>
        </div>

        <div>
          <Label htmlFor="contact">رابط الزرّ أو معلومات تواصل</Label>
          <Input id="contact" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="https://wa.me/201xxxxxxxx" className="mt-1" />
        </div>

        <div>
          <Label className="mb-2 block">صور المنتج/المرجع (اختياري، حتى 4)</Label>
          <div className="flex flex-wrap items-center gap-2">
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
          <Label htmlFor="extra">ملاحظات إضافية</Label>
          <Textarea id="extra" value={extraNotes} onChange={(e) => setExtraNotes(e.target.value)} rows={2} placeholder="مثلاً: ثنائية اللغة، خط Tajawal، أضف عدّاد..." className="mt-1" />
        </div>

        <Button onClick={generate} disabled={loading} variant="gradient" size="lg" className="w-full">
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          {loading ? "جاري التوليد..." : "توليد الصفحة"}
        </Button>
      </Card>
    </div>
  );
}
