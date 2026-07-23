"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ColorField } from "@/components/color-field";
import { exportElement, fileToDataUrl, shade } from "@/lib/canvas-export";
import { createClient } from "@/lib/supabase/client";
import { IdCard, Download, Loader2, Upload } from "lucide-react";

type Fmt = { id: string; label: string; w: number; h: number };
const FORMATS: Fmt[] = [
  { id: "card", label: "بطاقة عمل", w: 1050, h: 600 },
  { id: "fb", label: "غلاف فيسبوك", w: 1640, h: 624 },
  { id: "x", label: "هيدر X / تويتر", w: 1500, h: 500 },
  { id: "li", label: "بانر لينكدإن", w: 1584, h: 396 },
  { id: "yt", label: "غلاف يوتيوب", w: 2560, h: 1440 },
];

export default function CardPage() {
  const [name, setName] = useState("اسمك هنا");
  const [role, setRole] = useState("المسمّى الوظيفي");
  const [tagline, setTagline] = useState("جملة تعريفية قصيرة عن نشاطك");
  const [phone, setPhone] = useState("01000000000");
  const [email, setEmail] = useState("hello@brand.com");
  const [site, setSite] = useState("brand.com");
  const [logo, setLogo] = useState("");
  const [primary, setPrimary] = useState("#111827");
  const [accent, setAccent] = useState("#4f6ef7");
  const [textColor, setTextColor] = useState("#ffffff");
  const [fmtId, setFmtId] = useState("card");
  const [exporting, setExporting] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const fmt = FORMATS.find((f) => f.id === fmtId)!;
  const ratio = fmt.w / fmt.h;
  const previewW = ratio >= 2.2 ? 560 : 460;
  const previewH = Math.round(previewW / ratio);
  const isBanner = ratio >= 2.2;
  const s = previewW / fmt.w; // معامل التحجيم للمعاينة
  const px = (v: number) => Math.round(v * s * 3.4); // أحجام الخطوط تتناسب مع المقاس

  useEffect(() => {
    (async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data: p } = await supabase.from("profiles").select("brand_name, brand_colors, brand_logo_url").eq("id", user.id).maybeSingle();
        if (p?.brand_name) setName(p.brand_name as string);
        const colors = (p?.brand_colors as string[] | null) || [];
        if (colors[0]) setPrimary(colors[0]);
        if (colors[1]) setAccent(colors[1]);
        if (p?.brand_logo_url) {
          try {
            const res = await fetch(p.brand_logo_url as string);
            const blob = await res.blob();
            const r = new FileReader();
            r.onload = () => setLogo(r.result as string);
            r.readAsDataURL(blob);
          } catch { /* ignore */ }
        }
      } catch { /* ignore */ }
    })();
  }, []);

  async function onLogo(file: File | null) {
    if (!file || !file.type.startsWith("image/")) return;
    setLogo(await fileToDataUrl(file));
  }

  async function doExport(format: "png" | "pdf") {
    if (!ref.current) return;
    setExporting(true);
    try {
      await exportElement(ref.current, { name: `${fmt.id}-${name || "oji"}`, format, bg: primary, scale: 3 });
      toast.success("تمّ التنزيل 🎉");
    } catch (e) {
      toast.error("تعذّر التصدير", { description: e instanceof Error ? e.message : undefined });
    } finally {
      setExporting(false);
    }
  }

  const contacts = [phone, email, site].filter(Boolean);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-start gap-4 mb-6">
        <div className="size-12 rounded-xl bg-primary/10 grid place-items-center text-primary shrink-0">
          <IdCard className="size-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">بطاقة عمل + بانرات سوشيال</h1>
          <p className="text-muted-foreground mt-1">تصميم واحد → بطاقة عمل وأغلفة كل المنصّات بمقاساتها</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <div className="space-y-5">
          <Card className="p-5 space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <div><Label>الاسم / العلامة</Label><Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" /></div>
              <div><Label>المسمّى</Label><Input value={role} onChange={(e) => setRole(e.target.value)} className="mt-1" /></div>
            </div>
            <div><Label>جملة تعريفية</Label><Input value={tagline} onChange={(e) => setTagline(e.target.value)} className="mt-1" /></div>
            <div className="grid sm:grid-cols-3 gap-3">
              <div><Label>هاتف</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1" dir="ltr" /></div>
              <div><Label>بريد</Label><Input value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" dir="ltr" /></div>
              <div><Label>الموقع</Label><Input value={site} onChange={(e) => setSite(e.target.value)} className="mt-1" dir="ltr" /></div>
            </div>
            <div className="flex items-center gap-3">
              {logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logo} alt="" className="size-12 rounded object-contain border bg-white p-1" />
              ) : null}
              <label className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm cursor-pointer hover:border-primary">
                <input type="file" accept="image/*" className="hidden" onChange={(e) => onLogo(e.target.files?.[0] || null)} />
                <Upload className="size-4" /> {logo ? "تغيير اللوجو" : "رفع لوجو"}
              </label>
            </div>
          </Card>

          <Card className="p-5 space-y-4">
            <h3 className="font-semibold">المقاس والألوان</h3>
            <div>
              <Label>المقاس</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {FORMATS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFmtId(f.id)}
                    className={`px-3 py-1.5 rounded-md text-xs border transition-all ${fmtId === f.id ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:border-primary/50"}`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <ColorField label="أساسي" value={primary} onChange={setPrimary} />
              <ColorField label="مميّز" value={accent} onChange={setAccent} />
              <ColorField label="النص" value={textColor} onChange={setTextColor} />
            </div>
          </Card>

          <div className="flex gap-2">
            <Button variant="gradient" onClick={() => doExport("png")} disabled={exporting}>
              {exporting ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />} تنزيل PNG
            </Button>
            <Button variant="outline" onClick={() => doExport("pdf")} disabled={exporting}>
              <Download className="size-4" /> PDF
            </Button>
          </div>
        </div>

        <div className="lg:sticky lg:top-6">
          <p className="text-xs text-muted-foreground mb-2">معاينة — {fmt.label} ({fmt.w}×{fmt.h})</p>
          <div className="overflow-auto rounded-xl border shadow-sm mx-auto w-fit">
            <div
              ref={ref}
              dir="rtl"
              style={{
                width: previewW,
                height: previewH,
                position: "relative",
                overflow: "hidden",
                background: `linear-gradient(135deg, ${primary}, ${shade(primary, 16)})`,
                color: textColor,
                fontFamily: "'Tajawal','Segoe UI',sans-serif",
                display: "flex",
                alignItems: "center",
                padding: previewW * 0.06,
                boxSizing: "border-box",
              }}
            >
              {/* شريط لوني مميّز */}
              <div style={{ position: "absolute", insetInlineStart: 0, top: 0, bottom: 0, width: 6, background: accent }} />

              {isBanner ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", gap: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    {logo && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={logo} alt="" style={{ height: px(20), objectFit: "contain" }} />
                    )}
                    <div>
                      <div style={{ fontSize: px(30), fontWeight: 900, lineHeight: 1.1 }}>{name}</div>
                      <div style={{ fontSize: px(14), color: accent, fontWeight: 700, marginTop: 4 }}>{role}</div>
                      <div style={{ fontSize: px(12), opacity: 0.8, marginTop: 6, maxWidth: previewW * 0.5 }}>{tagline}</div>
                    </div>
                  </div>
                  <div dir="ltr" style={{ textAlign: "left", fontSize: px(12), lineHeight: 1.9, opacity: 0.92 }}>
                    {contacts.map((c) => (
                      <div key={c}>{c}</div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ width: "100%", textAlign: "center" }}>
                  {logo && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logo} alt="" style={{ height: px(26), objectFit: "contain", margin: "0 auto 10px", display: "block" }} />
                  )}
                  <div style={{ fontSize: px(30), fontWeight: 900 }}>{name}</div>
                  <div style={{ fontSize: px(15), color: accent, fontWeight: 700, marginTop: 4 }}>{role}</div>
                  <div style={{ width: px(40), height: 3, background: accent, margin: `${px(10)}px auto`, borderRadius: 3 }} />
                  <div dir="ltr" style={{ fontSize: px(13), lineHeight: 2, opacity: 0.92 }}>
                    {contacts.map((c) => (
                      <div key={c}>{c}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
