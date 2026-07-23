"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { ColorField } from "@/components/color-field";
import { exportElement } from "@/lib/canvas-export";
import {
  UtensilsCrossed,
  Plus,
  Trash2,
  Upload,
  Download,
  Loader2,
  GripVertical,
  Image as ImageIcon,
  RotateCcw,
} from "lucide-react";

type Item = { id: string; name: string; desc: string; price: string };
type Section = { id: string; title: string; items: Item[] };
type Layout = "classic" | "twocol" | "elegant";

const CURRENCIES = ["ج.م", "ر.س", "د.إ", "د.ك", "$", "€"];
const STORAGE_KEY = "oji_menu_designer_v1";

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const FONTS = [
  { id: "'Tajawal', 'Segoe UI', sans-serif", label: "تجوال (عصري)" },
  { id: "'Cairo', 'Segoe UI', sans-serif", label: "القاهرة" },
  { id: "'Amiri', 'Times New Roman', serif", label: "أميري (كلاسيك)" },
  { id: "'Segoe UI', Tahoma, sans-serif", label: "افتراضي" },
];

const emptyItem = (): Item => ({ id: uid(), name: "", desc: "", price: "" });
const sampleSections = (): Section[] => [
  {
    id: uid(),
    title: "المقبّلات",
    items: [
      { id: uid(), name: "حمّص بالطحينة", desc: "مع زيت زيتون وخبز طازج", price: "35" },
      { id: uid(), name: "سلطة سيزر", desc: "دجاج مشوي، جبن بارميزان", price: "55" },
    ],
  },
  {
    id: uid(),
    title: "الأطباق الرئيسية",
    items: [
      { id: uid(), name: "برجر لحم أنجوس", desc: "180 جرام + بطاطس", price: "120" },
      { id: uid(), name: "باستا ألفريدو", desc: "دجاج وكريمة وفطر", price: "95" },
    ],
  },
];

export default function MenuDesignerPage() {
  const [storeName, setStoreName] = useState("اسم المتجر");
  const [tagline, setTagline] = useState("قائمة الأسعار");
  const [logo, setLogo] = useState("");
  const [currency, setCurrency] = useState("ج.م");
  const [font, setFont] = useState(FONTS[0].id);
  const [layout, setLayout] = useState<Layout>("elegant");
  const [primary, setPrimary] = useState("#b8860b");
  const [accent, setAccent] = useState("#8b1a1a");
  const [bg, setBg] = useState("#fbf7ef");
  const [textColor, setTextColor] = useState("#2b2118");
  const [sections, setSections] = useState<Section[]>(sampleSections);
  const [exporting, setExporting] = useState(false);
  const [restored, setRestored] = useState(false);

  const previewRef = useRef<HTMLDivElement>(null);

  // استرجاع آخر عمل من المتصفّح
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (s.storeName) setStoreName(s.storeName);
        if (s.tagline !== undefined) setTagline(s.tagline);
        if (s.logo) setLogo(s.logo);
        if (s.currency) setCurrency(s.currency);
        if (s.font) setFont(s.font);
        if (s.layout) setLayout(s.layout);
        if (s.primary) setPrimary(s.primary);
        if (s.accent) setAccent(s.accent);
        if (s.bg) setBg(s.bg);
        if (s.textColor) setTextColor(s.textColor);
        if (Array.isArray(s.sections) && s.sections.length) setSections(s.sections);
      }
    } catch {
      /* ignore */
    }
    setRestored(true);
  }, []);

  // تعبئة من ملفّ العلامة (لو موجود ولم يُسترجع عمل سابق مخصّص)
  useEffect(() => {
    (async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const hadSaved = !!localStorage.getItem(STORAGE_KEY);
        const { data: p } = await supabase
          .from("profiles")
          .select("brand_name, brand_colors, brand_logo_url")
          .eq("id", user.id)
          .maybeSingle();
        if (!p) return;
        if (!hadSaved) {
          if (p.brand_name) setStoreName(p.brand_name as string);
          const colors = (p.brand_colors as string[] | null) || [];
          if (colors[0]) setPrimary(colors[0]);
          if (colors[1]) setAccent(colors[1]);
          if (p.brand_logo_url) {
            const dataUrl = await urlToDataUrl(p.brand_logo_url as string);
            if (dataUrl) setLogo(dataUrl);
          }
        }
      } catch {
        /* ignore */
      }
    })();
  }, []);

  // حفظ تلقائي
  useEffect(() => {
    if (!restored) return;
    const payload = { storeName, tagline, logo, currency, font, layout, primary, accent, bg, textColor, sections };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      /* تجاوز حدّ التخزين (لوجو كبير مثلاً) */
    }
  }, [restored, storeName, tagline, logo, currency, font, layout, primary, accent, bg, textColor, sections]);

  async function urlToDataUrl(url: string): Promise<string> {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      return await new Promise((resolve) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result as string);
        r.onerror = () => resolve("");
        r.readAsDataURL(blob);
      });
    } catch {
      return "";
    }
  }

  function uploadLogo(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("ارفع صورة صحيحة");
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      toast.error("اللوجو أكبر من 4MB");
      return;
    }
    const r = new FileReader();
    r.onload = () => setLogo(r.result as string);
    r.readAsDataURL(file);
  }

  // ——— تعديل الأقسام والمنتجات ———
  function addSection() {
    setSections((s) => [...s, { id: uid(), title: "قسم جديد", items: [emptyItem()] }]);
  }
  function removeSection(id: string) {
    setSections((s) => s.filter((x) => x.id !== id));
  }
  function updateSectionTitle(id: string, title: string) {
    setSections((s) => s.map((x) => (x.id === id ? { ...x, title } : x)));
  }
  function moveSection(id: string, dir: -1 | 1) {
    setSections((s) => {
      const i = s.findIndex((x) => x.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= s.length) return s;
      const copy = [...s];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });
  }
  function addItem(sid: string) {
    setSections((s) => s.map((x) => (x.id === sid ? { ...x, items: [...x.items, emptyItem()] } : x)));
  }
  function removeItem(sid: string, iid: string) {
    setSections((s) => s.map((x) => (x.id === sid ? { ...x, items: x.items.filter((it) => it.id !== iid) } : x)));
  }
  function updateItem(sid: string, iid: string, patch: Partial<Item>) {
    setSections((s) =>
      s.map((x) =>
        x.id === sid ? { ...x, items: x.items.map((it) => (it.id === iid ? { ...it, ...patch } : it)) } : x
      )
    );
  }

  function resetAll() {
    if (!confirm("مسح كل البيانات والبدء من جديد؟")) return;
    setStoreName("اسم المتجر");
    setTagline("قائمة الأسعار");
    setLogo("");
    setCurrency("ج.م");
    setLayout("elegant");
    setPrimary("#b8860b");
    setAccent("#8b1a1a");
    setBg("#fbf7ef");
    setTextColor("#2b2118");
    setSections(sampleSections());
    toast.success("تمّت إعادة التعيين");
  }

  async function exportImage(kind: "png" | "pdf") {
    const node = previewRef.current;
    if (!node) return;
    setExporting(true);
    try {
      await exportElement(node, { name: `menu-${storeName || "oji"}`, format: kind, bg });
      toast.success(kind === "png" ? "تمّ تنزيل الصورة 🎉" : "تمّ تنزيل الـ PDF 🎉");
    } catch (e) {
      toast.error("تعذّر التصدير", { description: e instanceof Error ? e.message : undefined });
    } finally {
      setExporting(false);
    }
  }

  const price = (v: string) => (v.trim() ? `${v} ${currency}` : "");

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-start gap-4 mb-6">
        <div className="size-12 rounded-xl bg-primary/10 grid place-items-center text-primary shrink-0">
          <UtensilsCrossed className="size-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">مصمّم المنيو / قائمة الأسعار</h1>
          <p className="text-muted-foreground mt-1">
            لوجوك، ألوان علامتك، أقسامك ومنتجاتك بالأسعار → صورة جاهزة للطباعة والنشر
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 items-start">
        {/* ————— لوحة التحكّم ————— */}
        <div className="space-y-5">
          {/* الهوية */}
          <Card className="p-5 space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <ImageIcon className="size-4 text-primary" /> الهوية
            </h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="store">اسم المتجر</Label>
                <Input id="store" value={storeName} onChange={(e) => setStoreName(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="tag">سطر فرعي</Label>
                <Input id="tag" value={tagline} onChange={(e) => setTagline(e.target.value)} className="mt-1" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              {logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logo} alt="logo" className="size-14 rounded-lg object-contain border bg-white p-1" />
              ) : (
                <div className="size-14 rounded-lg border grid place-items-center text-muted-foreground">
                  <ImageIcon className="size-5" />
                </div>
              )}
              <label className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm cursor-pointer hover:border-primary">
                <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadLogo(e.target.files?.[0] || null)} />
                <Upload className="size-4" /> {logo ? "تغيير اللوجو" : "رفع اللوجو"}
              </label>
              {logo && (
                <Button variant="ghost" size="sm" onClick={() => setLogo("")}>
                  <Trash2 className="size-4" /> إزالة
                </Button>
              )}
            </div>
          </Card>

          {/* الألوان والستايل */}
          <Card className="p-5 space-y-4">
            <h3 className="font-semibold">الألوان والستايل</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <ColorField label="أساسي" value={primary} onChange={setPrimary} />
              <ColorField label="مميّز" value={accent} onChange={setAccent} />
              <ColorField label="الخلفية" value={bg} onChange={setBg} />
              <ColorField label="النص" value={textColor} onChange={setTextColor} />
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              <div>
                <Label>التصميم</Label>
                <select
                  value={layout}
                  onChange={(e) => setLayout(e.target.value as Layout)}
                  className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                >
                  <option value="elegant">أنيق (خطوط)</option>
                  <option value="classic">كلاسيك</option>
                  <option value="twocol">عمودين</option>
                </select>
              </div>
              <div>
                <Label>الخطّ</Label>
                <select
                  value={font}
                  onChange={(e) => setFont(e.target.value)}
                  className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                >
                  {FONTS.map((f) => (
                    <option key={f.id} value={f.id}>{f.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>العملة</Label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
          </Card>

          {/* الأقسام */}
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">الأقسام والمنتجات</h3>
              <Button variant="outline" size="sm" onClick={addSection}>
                <Plus className="size-4" /> قسم
              </Button>
            </div>

            <div className="space-y-4">
              {sections.map((sec, si) => (
                <div key={sec.id} className="rounded-lg border p-3 space-y-3 bg-muted/20">
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col">
                      <button
                        type="button"
                        onClick={() => moveSection(sec.id, -1)}
                        disabled={si === 0}
                        className="text-muted-foreground hover:text-foreground disabled:opacity-30 leading-none"
                        title="أعلى"
                      >▲</button>
                      <button
                        type="button"
                        onClick={() => moveSection(sec.id, 1)}
                        disabled={si === sections.length - 1}
                        className="text-muted-foreground hover:text-foreground disabled:opacity-30 leading-none"
                        title="أسفل"
                      >▼</button>
                    </div>
                    <Input
                      value={sec.title}
                      onChange={(e) => updateSectionTitle(sec.id, e.target.value)}
                      placeholder="اسم القسم"
                      className="font-semibold"
                    />
                    <Button variant="ghost" size="icon" onClick={() => removeSection(sec.id)} title="حذف القسم">
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {sec.items.map((it) => (
                      <div key={it.id} className="flex items-start gap-2">
                        <GripVertical className="size-4 mt-2.5 text-muted-foreground shrink-0" />
                        <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_90px] gap-2 flex-1">
                          <Input
                            value={it.name}
                            onChange={(e) => updateItem(sec.id, it.id, { name: e.target.value })}
                            placeholder="اسم المنتج"
                          />
                          <Input
                            value={it.desc}
                            onChange={(e) => updateItem(sec.id, it.id, { desc: e.target.value })}
                            placeholder="وصف (اختياري)"
                          />
                          <Input
                            value={it.price}
                            onChange={(e) => updateItem(sec.id, it.id, { price: e.target.value })}
                            placeholder="السعر"
                            inputMode="decimal"
                          />
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => removeItem(sec.id, it.id)} title="حذف">
                          <Trash2 className="size-4 text-muted-foreground" />
                        </Button>
                      </div>
                    ))}
                    <Button variant="ghost" size="sm" onClick={() => addItem(sec.id)}>
                      <Plus className="size-4" /> منتج
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <div className="flex flex-wrap gap-2">
            <Button variant="gradient" onClick={() => exportImage("png")} disabled={exporting}>
              {exporting ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />} تنزيل صورة PNG
            </Button>
            <Button variant="outline" onClick={() => exportImage("pdf")} disabled={exporting}>
              <Download className="size-4" /> PDF
            </Button>
            <Button variant="ghost" onClick={resetAll}>
              <RotateCcw className="size-4" /> إعادة تعيين
            </Button>
          </div>
        </div>

        {/* ————— المعاينة الحيّة ————— */}
        <div className="lg:sticky lg:top-6">
          <p className="text-xs text-muted-foreground mb-2">معاينة حيّة — الصورة تُصدَّر بنفس الشكل بدقّة عالية</p>
          <div className="overflow-auto rounded-xl border shadow-sm bg-white">
            <div
              ref={previewRef}
              dir="rtl"
              style={{
                width: 720,
                minHeight: 900,
                background: bg,
                color: textColor,
                fontFamily: font,
                padding: 48,
                boxSizing: "border-box",
              }}
            >
              {/* رأس المنيو */}
              <div style={{ textAlign: "center", marginBottom: 28 }}>
                {logo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logo}
                    alt="logo"
                    style={{ height: 96, objectFit: "contain", margin: "0 auto 12px", display: "block" }}
                  />
                )}
                <div style={{ fontSize: 40, fontWeight: 800, color: primary, letterSpacing: 0.5 }}>
                  {storeName || "اسم المتجر"}
                </div>
                {tagline && (
                  <div style={{ fontSize: 18, color: accent, marginTop: 4, fontWeight: 600 }}>{tagline}</div>
                )}
                <div
                  style={{
                    width: 120,
                    height: 3,
                    background: accent,
                    margin: "16px auto 0",
                    borderRadius: 3,
                  }}
                />
              </div>

              {/* الأقسام */}
              <div
                style={
                  layout === "twocol"
                    ? { columnCount: 2, columnGap: 40 }
                    : undefined
                }
              >
                {sections.map((sec) => (
                  <div key={sec.id} style={{ marginBottom: 28, breakInside: "avoid" }}>
                    <div
                      style={{
                        fontSize: 24,
                        fontWeight: 800,
                        color: layout === "classic" ? "#fff" : primary,
                        borderBottom: layout === "elegant" ? `2px solid ${primary}` : "none",
                        background: layout === "classic" ? primary : "transparent",
                        paddingBottom: layout === "elegant" ? 6 : 8,
                        paddingTop: layout === "classic" ? 8 : 0,
                        paddingRight: layout === "classic" ? 14 : 0,
                        paddingLeft: layout === "classic" ? 14 : 0,
                        borderRadius: layout === "classic" ? 8 : 0,
                        marginBottom: 14,
                      }}
                    >
                      {sec.title}
                    </div>

                    {sec.items.map((it) => (
                      <div key={it.id} style={{ marginBottom: 14 }}>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                          <div style={{ flex: "0 1 auto", fontWeight: 700, fontSize: 18 }}>{it.name || "—"}</div>
                          {layout === "elegant" && (
                            <div
                              style={{
                                flex: 1,
                                borderBottom: `1px dotted ${accent}`,
                                transform: "translateY(-4px)",
                                opacity: 0.5,
                              }}
                            />
                          )}
                          <div
                            style={{
                              flex: layout === "elegant" ? "0 0 auto" : "1",
                              fontWeight: 800,
                              fontSize: 18,
                              color: accent,
                              whiteSpace: "nowrap",
                              textAlign: "left",
                            }}
                          >
                            {price(it.price)}
                          </div>
                        </div>
                        {it.desc && (
                          <div style={{ fontSize: 14, opacity: 0.65, marginTop: 2 }}>{it.desc}</div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* تذييل */}
              <div style={{ textAlign: "center", marginTop: 32, fontSize: 13, color: accent, opacity: 0.8 }}>
                {storeName}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
