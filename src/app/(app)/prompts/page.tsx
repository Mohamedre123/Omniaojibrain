"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Copy, Check, Loader2, Wand2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Fmt = "ar" | "en" | "json";
type P = { cat: string; title: string; ar: string; en: string; json: object };
type Project = { id: string; name: string };

const CATS = ["الكل", "منتجات", "طعام", "أزياء", "عقارات", "أشخاص", "إعلانات"];
const USED_KEY = "oji_prompts_used_v1";

const PROMPTS: P[] = [
  {
    cat: "منتجات", title: "منتج فاخر على رخام",
    ar: "صورة إعلانية 8K فائقة الواقعية لمنتج [اسم المنتج] موضوعٍ على سطح رخام أبيض فاخر بعروقٍ ذهبية. إضاءة استوديو ناعمة منتشرة مع إضاءة حوافّ خفيفة (rim light) تبرز الحواف، عمق ميدان ضحل وخلفية ناعمة (bokeh)، ألوان نظيفة غنية، انعكاسٌ خفيفٌ للمنتج على الرخام، تكوينٌ بمستوى مجلات الإعلانات الفاخرة، عدسة 85mm، تباينٌ ناعم، مزاجٌ راقٍ وهادئ.",
    en: "Ultra-realistic 8K commercial product photo of [product] on a luxurious white marble surface with golden veins. Soft diffused studio lighting with a subtle rim light defining the edges, shallow depth of field with creamy bokeh, rich clean colors, gentle reflection on the marble, magazine-grade luxury composition, 85mm lens, soft contrast, elegant calm mood.",
    json: { subject: "[product]", setting: "white marble with golden veins", lighting: "soft diffused studio + rim light", lens: "85mm", depth_of_field: "shallow, creamy bokeh", palette: "clean, rich", mood: "elegant, luxury", quality: "ultra-realistic 8K", aspect: "1:1" },
  },
  {
    cat: "طعام", title: "طعام شهي سينمائي",
    ar: "تصوير طعامٍ سينمائي فائق الجودة لطبق [اسم الطبق]، بخارٌ خفيفٌ يتصاعد، إضاءةٌ جانبيةٌ دراماتيكية تبرز الملمس والتفاصيل، خلفيةٌ خشبيةٌ داكنة مع أدواتٍ متناثرةٍ بعناية، ألوانٌ دافئةٌ غنية، قطراتٌ وتفاصيلُ واقعية، عمق ميدان ضحل، زاوية 45 درجة، مزاجٌ شهيٌّ فاخر، جودة 8K.",
    en: "High-end cinematic food photography of [dish], gentle rising steam, dramatic side lighting revealing texture and detail, dark rustic wooden background with carefully scattered props, warm rich colors, realistic droplets and details, shallow depth of field, 45-degree angle, appetizing premium mood, 8K quality.",
    json: { subject: "[dish]", style: "cinematic food photography", lighting: "dramatic side light", background: "dark rustic wood", extras: "steam, scattered props", angle: "45deg", palette: "warm, rich", mood: "appetizing, premium", quality: "8K", aspect: "4:5" },
  },
  {
    cat: "أزياء", title: "لقطة أزياء تحريرية",
    ar: "لقطة أزياءٍ تحريرية (editorial) لعارضٍ يرتدي [الملابس]، إضاءةٌ سينمائيةٌ ناعمة بلمسة غروب، خلفيةٌ بسيطةٌ بلونٍ متناسق، وضعيةٌ واثقةٌ أنيقة، عدسة 50mm، تباينٌ ناعم، ألوانٌ راقية، تفاصيلُ قماشٍ واقعية، مزاجٌ عصريٌّ فاخر، جودة 8K عمودي 4:5.",
    en: "Editorial fashion shot of a model wearing [outfit], soft cinematic lighting with a golden-hour touch, minimal color-coordinated background, confident elegant pose, 50mm lens, soft contrast, refined colors, realistic fabric detail, modern premium mood, 8K, 4:5 portrait.",
    json: { subject: "model wearing [outfit]", style: "editorial fashion", lighting: "soft cinematic, golden hour", background: "minimal, color-coordinated", lens: "50mm", mood: "modern, premium", quality: "8K", aspect: "4:5" },
  },
  {
    cat: "عقارات", title: "داخلية معمارية فاخرة",
    ar: "تصويرٌ معماريٌّ داخليٌّ فاخرٌ لـ [الغرفة/المكان]، إضاءةٌ طبيعيةٌ ناعمةٌ من نوافذَ كبيرة، خطوطٌ نظيفةٌ وتكوينٌ متماثل، ألوانٌ محايدةٌ دافئة، تفاصيلُ موادَ واقعية (خشب، رخام، قماش)، عدسةٌ واسعة 24mm، عمق ميدانٍ عميق، مزاجٌ هادئٌ راقٍ، جودة 8K أفقي 16:9.",
    en: "Luxury interior architectural photography of [room], soft natural light from large windows, clean lines and balanced composition, warm neutral palette, realistic material detail (wood, marble, fabric), 24mm wide lens, deep depth of field, calm refined mood, 8K, 16:9.",
    json: { subject: "[room]", style: "architectural interior", lighting: "soft natural window light", lens: "24mm wide", palette: "warm neutral", mood: "calm, refined", quality: "8K", aspect: "16:9" },
  },
  {
    cat: "أشخاص", title: "بورتريه احترافي",
    ar: "بورتريهٌ احترافيٌّ لـ [الشخص]، إضاءةُ استوديو ثلاثية (key/fill/rim) ناعمة، خلفيةٌ داكنةٌ متدرجة، تركيزٌ حادٌّ على العينين، بشرةٌ طبيعيةٌ بتفاصيلَ واقعية، عدسة 85mm بفتحةٍ واسعة f/1.8، عمق ميدانٍ ضحل، مزاجٌ واثقٌ راقٍ، جودة 8K عمودي 4:5.",
    en: "Professional portrait of [person], soft three-point studio lighting (key/fill/rim), dark gradient background, tack-sharp focus on the eyes, natural realistic skin detail, 85mm lens at f/1.8, shallow depth of field, confident refined mood, 8K, 4:5 portrait.",
    json: { subject: "[person]", style: "professional portrait", lighting: "3-point studio", lens: "85mm f/1.8", focus: "eyes", background: "dark gradient", mood: "confident, refined", quality: "8K", aspect: "4:5" },
  },
  {
    cat: "إعلانات", title: "بوستر عرض ترويجي",
    ar: "بوستر إعلانيٌّ احترافيٌّ لعرض [العرض]، تكوينٌ جريءٌ بمساحةٍ واضحةٍ للنص، ألوانٌ متباينةٌ جذّابة (استخدم ألوان العلامة)، المنتج بارزٌ في المنتصف بإضاءةٍ درامية، إحساسٌ بالحركة والطاقة، جودة 8K، مساحةٌ علويةٌ فارغةٌ للعنوان، أبعاد 1:1.",
    en: "Professional promotional poster for [offer], bold composition with clear text space, eye-catching contrasting colors (use brand colors), hero product centered with dramatic lighting, sense of energy and motion, 8K quality, empty top area for the headline, 1:1.",
    json: { subject: "promo poster for [offer]", layout: "bold, clear text space", colors: "contrasting brand colors", hero: "centered product, dramatic light", mood: "energetic", quality: "8K", aspect: "1:1" },
  },
];

const FMT_LABEL: Record<Fmt, string> = { ar: "عربي", en: "English", json: "JSON" };

export default function PromptsPage() {
  const [cat, setCat] = useState("الكل");
  const [fmt, setFmt] = useState<Fmt>("ar");
  const [justCopied, setJustCopied] = useState("");
  const [used, setUsed] = useState<Set<string>>(new Set());
  const [extra, setExtra] = useState<P[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState("");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(USED_KEY);
      if (raw) setUsed(new Set(JSON.parse(raw) as string[]));
    } catch { /* ignore */ }
    (async () => {
      const supabase = createClient();
      const { data } = await supabase.from("projects").select("id, name").order("updated_at", { ascending: false });
      setProjects((data as Project[]) || []);
    })();
  }, []);

  const pool = useMemo(() => [...PROMPTS, ...extra], [extra]);
  const list = useMemo(
    () => pool.filter((p) => !used.has(p.title)).filter((p) => cat === "الكل" || p.cat === cat),
    [pool, used, cat]
  );

  function persistUsed(next: Set<string>) {
    try { localStorage.setItem(USED_KEY, JSON.stringify([...next])); } catch { /* ignore */ }
  }

  function textOf(p: P): string {
    return fmt === "json" ? JSON.stringify(p.json, null, 2) : fmt === "en" ? p.en : p.ar;
  }

  async function generateMore(silent = false, catHint?: string) {
    if (generating) return;
    setGenerating(true);
    try {
      const useCat = catHint || cat;
      const avoid = [...used].slice(-12).join("، ");
      const input = `الفئة المطلوبة: ${useCat === "الكل" ? "متنوّعة" : useCat}.${avoid ? ` ولّد أفكاراً جديدة مختلفة تماماً عن هذه العناوين: ${avoid}.` : ""}`;
      const res = await fetch("/api/generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool: "smart_image_prompts", input, project_id: projectId || undefined }),
      });
      if (!res.ok || !res.body) { if (!silent) toast.error("تعذّر التوليد"); return; }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let acc = "";
      while (true) { const { value, done } = await reader.read(); if (done) break; acc += dec.decode(value, { stream: true }); }
      const m = acc.match(/\[[\s\S]*\]/);
      if (!m) { if (!silent) toast.error("لم يرجع نتائج صالحة"); return; }
      const parsed = JSON.parse(m[0]) as P[];
      const existing = new Set(pool.map((p) => p.title));
      const clean = parsed.filter((p) => p && p.title && p.ar && p.en && !existing.has(p.title) && !used.has(p.title))
        .map((p) => ({ cat: p.cat || "متنوّع", title: p.title, ar: p.ar, en: p.en, json: p.json || {} }));
      if (clean.length === 0) { if (!silent) toast("مفيش أفكار جديدة دلوقتي، جرّب تاني"); return; }
      setExtra((prev) => [...prev, ...clean]);
      if (!silent) toast.success(`اتضاف ${clean.length} برومبت على مقاس مشروعك ✨`);
    } catch {
      if (!silent) toast.error("تعذّر الاتصال");
    } finally {
      setGenerating(false);
    }
  }

  function copy(p: P) {
    navigator.clipboard.writeText(textOf(p)).then(() => {
      setJustCopied(p.title);
      toast.success("اتنسخ البرومبت — واتشال عشان ييجي مكانه أحدث");
      setTimeout(() => setJustCopied(""), 1200);
      // بعد ثانية: شيله (تدوير) عشان ييجي مكانه غيره
      setTimeout(() => {
        setUsed((prev) => {
          const next = new Set(prev).add(p.title);
          persistUsed(next);
          return next;
        });
      }, 500);
      // ييجي مكانه واحد من نفس النوع بفكرة مختلفة — ولّد لو النوع ده قلّ
      const sameKind = pool.filter((x) => !used.has(x.title) && x.title !== p.title && x.cat === p.cat).length;
      if (sameKind < 3) void generateMore(true, p.cat);
    });
  }

  function resetUsed() {
    setUsed(new Set());
    persistUsed(new Set());
    toast.success("رجّعنا كل البرومبتات");
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-5">
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2"><Sparkles className="size-7 text-primary" /> برومبتات احترافية</h1>
        <p className="text-muted-foreground mt-1 text-sm">برومبتات مفصّلة تتجدّد باستمرار — اختَر مشروعك عشان تطلع على مقاس نشاطك، وأي برومبت تنسخه بييجي مكانه واحد جديد.</p>
      </div>

      {/* المشروع + توليد */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4">
        {projects.length > 0 && (
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="h-10 px-3 rounded-md border border-input bg-background text-sm sm:max-w-[220px]"
            title="على مقاس أي مشروع؟"
          >
            <option value="">— برومبتات عامة —</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        )}
        <Button variant="gradient" size="sm" onClick={() => void generateMore(false)} disabled={generating} className="sm:ml-2">
          {generating ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />}
          {generating ? "بيولّد..." : projectId ? "برومبتات على مقاس مشروعي" : "ولّد برومبتات جديدة"}
        </Button>
        {used.size > 0 && (
          <Button variant="ghost" size="sm" onClick={resetUsed} className="text-xs text-muted-foreground">↺ رجّع المنسوخة ({used.size})</Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
          {CATS.map((c) => (
            <button key={c} onClick={() => setCat(c)} className={`shrink-0 px-3 py-1.5 rounded-full text-sm border ${cat === c ? "gradient-brand text-white border-transparent" : "bg-card hover:border-primary/50"}`}>{c}</button>
          ))}
        </div>
        <div className="inline-flex rounded-lg border bg-card p-0.5 sm:mr-auto shrink-0">
          {(["ar", "en", "json"] as Fmt[]).map((f) => (
            <button key={f} onClick={() => setFmt(f)} className={`px-3 py-1.5 rounded-md text-sm ${fmt === f ? "gradient-brand text-white" : "text-muted-foreground"}`}>{FMT_LABEL[f]}</button>
          ))}
        </div>
      </div>

      {list.length === 0 ? (
        <Card className="p-10 text-center">
          <Sparkles className="size-10 mx-auto text-muted-foreground mb-3 opacity-50" />
          <p className="text-sm text-muted-foreground">خلصت البرومبتات في الفئة دي — اضغط «ولّد برومبتات جديدة» أو رجّع المنسوخة.</p>
          <Button variant="gradient" size="sm" onClick={() => void generateMore(false)} disabled={generating} className="mt-4">
            {generating ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />} توليد المزيد
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {list.map((p) => (
            <Card key={p.title} className="p-5 flex flex-col transition-all">
              <div className="flex items-center justify-between gap-2">
                <div><span className="text-xs text-primary font-medium">{p.cat}</span><h3 className="font-semibold">{p.title}</h3></div>
                <button onClick={() => copy(p)} className="text-primary shrink-0" title="انسخ (وييجي مكانه واحد جديد)">{justCopied === p.title ? <Check className="size-5" /> : <Copy className="size-5" />}</button>
              </div>
              <pre dir={fmt === "ar" ? "rtl" : "ltr"} className="mt-3 text-xs bg-muted/40 rounded-lg p-3 whitespace-pre-wrap break-words font-sans leading-relaxed max-h-56 overflow-y-auto">{textOf(p)}</pre>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
