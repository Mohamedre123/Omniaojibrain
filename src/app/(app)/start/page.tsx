"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ColorField } from "@/components/color-field";
import { createClient } from "@/lib/supabase/client";
import { Rocket, Check, ArrowLeft, Loader2, Search } from "lucide-react";

const STEPS = [
  { id: "brand", title: "اضبط هوية علامتك", desc: "اسم، نبرة، ألوان، ولوجو من الإعدادات", href: "/settings" },
  { id: "project", title: "اعمل أول مشروع", desc: "أو استخدم Magic Brief من رابط", href: "/dashboard" },
  { id: "image", title: "ولّد أول صورة", desc: "من الاستوديو", href: "/studio" },
  { id: "assistant", title: "جرّب المساعد العام", desc: "اسأله عن استراتيجية أو أفكار", href: "/assistant" },
  { id: "knowledge", title: "أضف معرفة مشروعك", desc: "منتجات وأسعار وأسئلة شائعة", href: "/knowledge" },
  { id: "templates", title: "تصفّح مكتبة القوالب", desc: "قوالب جاهزة ومرجع تصوير", href: "/templates" },
];
const KEY = "oji_onboarding";

export default function StartPage() {
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [brandName, setBrandName] = useState("");
  const [primary, setPrimary] = useState("#4f6ef7");
  const [accent, setAccent] = useState("#f59e0b");
  const [savingBrand, setSavingBrand] = useState(false);
  const [brandLoaded, setBrandLoaded] = useState(false);

  useEffect(() => { try { setDone(JSON.parse(localStorage.getItem(KEY) || "{}")); } catch {} }, []);

  useEffect(() => {
    (async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data: p } = await supabase.from("profiles").select("brand_name, brand_colors").eq("id", user.id).maybeSingle();
        if (p?.brand_name) setBrandName(p.brand_name as string);
        const colors = (p?.brand_colors as string[] | null) || [];
        if (colors[0]) setPrimary(colors[0]);
        if (colors[1]) setAccent(colors[1]);
      } catch { /* ignore */ } finally { setBrandLoaded(true); }
    })();
  }, []);

  async function saveBrand() {
    if (!brandName.trim()) { toast.error("اكتب اسم علامتك"); return; }
    setSavingBrand(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase.from("profiles").update({
        brand_name: brandName.trim(),
        brand_colors: [primary, accent],
        updated_at: new Date().toISOString(),
      }).eq("id", user.id);
      if (error) { toast.error("تعذّر الحفظ", { description: error.message }); return; }
      toast.success("اتحفظت هويتك ✨ — كل الأدوات هتشتغل عليها");
      const next = { ...done, brand: true };
      setDone(next); localStorage.setItem(KEY, JSON.stringify(next));
    } finally { setSavingBrand(false); }
  }
  function toggle(id: string) {
    const next = { ...done, [id]: !done[id] };
    setDone(next); localStorage.setItem(KEY, JSON.stringify(next));
  }
  const completed = STEPS.filter((s) => done[s.id]).length;

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-6 text-center">
        <div className="mx-auto size-16 rounded-2xl gradient-brand grid place-items-center mb-4 animate-float-slow"><Rocket className="size-8 text-white" /></div>
        <h1 className="text-2xl sm:text-3xl font-bold">ابدأ مع Oji</h1>
        <p className="text-muted-foreground mt-2 text-sm">6 خطوات سريعة تخلّيك تستفيد من الموقع بالكامل.</p>
        <div className="mt-4 h-2 rounded-full bg-muted overflow-hidden max-w-xs mx-auto">
          <div className="h-full gradient-brand transition-all" style={{ width: `${(completed / STEPS.length) * 100}%` }} />
        </div>
        <p className="text-xs text-muted-foreground mt-2">{completed} / {STEPS.length}</p>
      </div>

      {/* إعداد سريع للهوية */}
      <Card className="p-5 mb-5 space-y-4">
        <div>
          <h3 className="font-semibold flex items-center gap-1.5">✨ إعداد سريع لهويتك</h3>
          <p className="text-xs text-muted-foreground mt-0.5">احفظها هنا وكل الأدوات (صور، تصميمات، محتوى) هتشتغل على مقاسك تلقائياً.</p>
        </div>
        <div>
          <Label htmlFor="bn" className="text-xs">اسم علامتك</Label>
          <Input id="bn" value={brandName} onChange={(e) => setBrandName(e.target.value)} placeholder="مثلاً: متجر لمسة" className="mt-1" disabled={!brandLoaded} />
        </div>
        <div className="grid grid-cols-2 gap-3 max-w-xs">
          <ColorField label="لون أساسي" value={primary} onChange={setPrimary} />
          <ColorField label="لون مميّز" value={accent} onChange={setAccent} />
        </div>
        <Button onClick={saveBrand} disabled={savingBrand || !brandName.trim()} variant="gradient" className="w-full sm:w-auto">
          {savingBrand ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />} حفظ الهوية
        </Button>
      </Card>

      {/* تلميح البحث السريع */}
      <button
        onClick={() => window.dispatchEvent(new Event("oji-open-palette"))}
        className="w-full mb-5 rounded-lg border bg-card p-3 flex items-center gap-2 text-sm text-muted-foreground hover:border-primary/50 transition-colors"
      >
        <Search className="size-4" /> عندك أدوات كتير؟ دوّر على أي أداة بسرعة — <span className="text-primary font-medium">Ctrl+K</span> أو <Link href="/tools" className="text-primary font-medium underline" onClick={(e) => e.stopPropagation()}>دليل الأدوات</Link>
      </button>

      <div className="space-y-3">
        {STEPS.map((s) => (
          <Card key={s.id} className="p-4 flex items-center gap-3">
            <button onClick={() => toggle(s.id)} className={`size-7 rounded-full border grid place-items-center shrink-0 ${done[s.id] ? "bg-primary border-primary text-white" : ""}`}>
              {done[s.id] && <Check className="size-4" />}
            </button>
            <div className="flex-1 min-w-0">
              <h3 className={`font-semibold text-sm ${done[s.id] ? "line-through text-muted-foreground" : ""}`}>{s.title}</h3>
              <p className="text-xs text-muted-foreground">{s.desc}</p>
            </div>
            <Link href={s.href} className="text-primary shrink-0 text-sm inline-flex items-center gap-1">افتح <ArrowLeft className="size-3.5" /></Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
