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
import { ImagePlus, Download, Loader2, Upload, Trash2 } from "lucide-react";

type Layout = "spotlight" | "split";

export default function ProductAdPage() {
  const [product, setProduct] = useState("");
  const [logo, setLogo] = useState("");
  const [badge, setBadge] = useState("خصم 30%");
  const [headline, setHeadline] = useState("عرض لا يُفوّت");
  const [subtitle, setSubtitle] = useState("جودة عالية · كمية محدودة");
  const [oldPrice, setOldPrice] = useState("400");
  const [newPrice, setNewPrice] = useState("280");
  const [currency, setCurrency] = useState("ج.م");
  const [cta, setCta] = useState("اطلب الآن");
  const [primary, setPrimary] = useState("#7c3aed");
  const [accent, setAccent] = useState("#f59e0b");
  const [textColor, setTextColor] = useState("#ffffff");
  const [layout, setLayout] = useState<Layout>("spotlight");
  const [exporting, setExporting] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data: p } = await supabase.from("profiles").select("brand_colors, brand_logo_url").eq("id", user.id).maybeSingle();
        const colors = (p?.brand_colors as string[] | null) || [];
        if (colors[0]) setPrimary(colors[0]);
        if (colors[1]) setAccent(colors[1]);
        if (p?.brand_logo_url) {
          try {
            const res = await fetch(p.brand_logo_url as string);
            const blob = await res.blob();
            const rd = new FileReader();
            rd.onload = () => setLogo(rd.result as string);
            rd.readAsDataURL(blob);
          } catch { /* ignore */ }
        }
      } catch { /* ignore */ }
    })();
  }, []);

  async function onFile(file: File | null, set: (v: string) => void) {
    if (!file || !file.type.startsWith("image/")) return;
    if (file.size > 8 * 1024 * 1024) { toast.error("الصورة أكبر من 8MB"); return; }
    set(await fileToDataUrl(file));
  }

  async function doExport(format: "png" | "pdf") {
    if (!ref.current) return;
    if (!product) { toast.error("ارفع صورة المنتج أولاً"); return; }
    setExporting(true);
    try {
      await exportElement(ref.current, { name: `ad-${headline || "oji"}`, format, bg: primary, scale: 2.5 });
      toast.success("تمّ التنزيل 🎉");
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
          <ImagePlus className="size-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">محوّل منتج → إعلان بصري</h1>
          <p className="text-muted-foreground mt-1">ارفع صورة منتجك واكتب العرض → إعلان جاهز للنشر بمقاس 4:5</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <div className="space-y-5">
          <Card className="p-5 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <label className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm cursor-pointer hover:border-primary">
                <input type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0] || null, setProduct)} />
                <Upload className="size-4" /> {product ? "تغيير صورة المنتج" : "صورة المنتج *"}
              </label>
              {product && (
                <Button variant="ghost" size="sm" onClick={() => setProduct("")}>
                  <Trash2 className="size-4" /> إزالة
                </Button>
              )}
              <label className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm cursor-pointer hover:border-primary">
                <input type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0] || null, setLogo)} />
                <Upload className="size-4" /> {logo ? "تغيير اللوجو" : "لوجو"}
              </label>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div><Label>الشارة (Badge)</Label><Input value={badge} onChange={(e) => setBadge(e.target.value)} className="mt-1" /></div>
              <div><Label>دعوة للعمل (CTA)</Label><Input value={cta} onChange={(e) => setCta(e.target.value)} className="mt-1" /></div>
            </div>
            <div><Label>العنوان</Label><Input value={headline} onChange={(e) => setHeadline(e.target.value)} className="mt-1" /></div>
            <div><Label>السطر الفرعي</Label><Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} className="mt-1" /></div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>السعر قبل</Label><Input value={oldPrice} onChange={(e) => setOldPrice(e.target.value)} className="mt-1" inputMode="decimal" /></div>
              <div><Label>السعر بعد</Label><Input value={newPrice} onChange={(e) => setNewPrice(e.target.value)} className="mt-1" inputMode="decimal" /></div>
              <div>
                <Label>العملة</Label>
                <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                  {["ج.م", "ر.س", "د.إ", "د.ك", "$", "€"].map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </Card>

          <Card className="p-5 space-y-4">
            <h3 className="font-semibold">الألوان والتصميم</h3>
            <div className="grid grid-cols-3 gap-3">
              <ColorField label="أساسي" value={primary} onChange={setPrimary} />
              <ColorField label="مميّز" value={accent} onChange={setAccent} />
              <ColorField label="النص" value={textColor} onChange={setTextColor} />
            </div>
            <div className="max-w-xs">
              <Label>التصميم</Label>
              <select value={layout} onChange={(e) => setLayout(e.target.value as Layout)} className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                <option value="spotlight">المنتج في المنتصف</option>
                <option value="split">نصّ + منتج (جنب بعض)</option>
              </select>
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
          <p className="text-xs text-muted-foreground mb-2">معاينة (1080×1350 · 4:5)</p>
          <div className="overflow-auto rounded-xl border shadow-sm mx-auto w-fit">
            <div
              ref={ref}
              dir="rtl"
              style={{
                width: 432,
                height: 540,
                position: "relative",
                overflow: "hidden",
                background: `linear-gradient(150deg, ${primary}, ${shade(primary, -22)})`,
                color: textColor,
                fontFamily: "'Tajawal','Segoe UI',sans-serif",
              }}
            >
              {/* الشارة */}
              {badge && (
                <div style={{ position: "absolute", top: 20, insetInlineStart: 20, background: accent, color: "#111", fontWeight: 900, fontSize: 16, padding: "6px 16px", borderRadius: 999, zIndex: 3 }}>
                  {badge}
                </div>
              )}
              {logo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logo} alt="" style={{ position: "absolute", top: 18, insetInlineEnd: 20, height: 38, objectFit: "contain", zIndex: 3 }} />
              )}

              {layout === "spotlight" ? (
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column" }}>
                  <div style={{ flex: 1, display: "grid", placeItems: "center", padding: 40, paddingBottom: 10 }}>
                    {product ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={product} alt="" style={{ maxWidth: "88%", maxHeight: 260, objectFit: "contain", filter: "drop-shadow(0 20px 30px rgba(0,0,0,.35))" }} />
                    ) : (
                      <div style={{ opacity: 0.6, fontSize: 14 }}>صورة المنتج</div>
                    )}
                  </div>
                  <div style={{ padding: "0 28px 26px", textAlign: "center" }}>
                    <div style={{ fontSize: 30, fontWeight: 900, textShadow: "0 2px 10px rgba(0,0,0,.3)" }}>{headline}</div>
                    {subtitle && <div style={{ fontSize: 15, opacity: 0.9, marginTop: 4 }}>{subtitle}</div>}
                    <PriceRow oldP={price(oldPrice)} newP={price(newPrice)} accent={accent} />
                    {cta && <CtaBtn text={cta} accent={accent} />}
                  </div>
                </div>
              ) : (
                <div style={{ position: "absolute", inset: 0, display: "flex" }}>
                  <div style={{ flex: 1, display: "grid", placeItems: "center", padding: 20 }}>
                    {product ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={product} alt="" style={{ maxWidth: "100%", maxHeight: 360, objectFit: "contain", filter: "drop-shadow(0 16px 26px rgba(0,0,0,.35))" }} />
                    ) : (
                      <div style={{ opacity: 0.6, fontSize: 14 }}>صورة المنتج</div>
                    )}
                  </div>
                  <div style={{ width: 180, padding: "70px 18px 24px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                    <div style={{ fontSize: 26, fontWeight: 900, lineHeight: 1.2 }}>{headline}</div>
                    {subtitle && <div style={{ fontSize: 13, opacity: 0.9, marginTop: 6 }}>{subtitle}</div>}
                    <PriceRow oldP={price(oldPrice)} newP={price(newPrice)} accent={accent} col />
                    {cta && <CtaBtn text={cta} accent={accent} />}
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

function PriceRow({ oldP, newP, accent, col }: { oldP: string; newP: string; accent: string; col?: boolean }) {
  if (!oldP && !newP) return null;
  return (
    <div style={{ display: "flex", flexDirection: col ? "column" : "row", alignItems: "center", justifyContent: "center", gap: col ? 2 : 10, marginTop: 12 }}>
      {oldP && <span style={{ textDecoration: "line-through", opacity: 0.6, fontSize: 16 }}>{oldP}</span>}
      {newP && <span style={{ fontSize: 30, fontWeight: 900, color: accent }}>{newP}</span>}
    </div>
  );
}

function CtaBtn({ text, accent }: { text: string; accent: string }) {
  return (
    <div style={{ marginTop: 14, textAlign: "center" }}>
      <span style={{ display: "inline-block", background: accent, color: "#111", fontWeight: 800, fontSize: 16, padding: "10px 26px", borderRadius: 999 }}>
        {text}
      </span>
    </div>
  );
}
