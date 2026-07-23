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
import { Ticket, Download, Loader2, Upload } from "lucide-react";

export default function CouponPage() {
  const [headline, setHeadline] = useState("خصم 30%");
  const [subtitle, setSubtitle] = useState("على كل المنتجات لفترة محدودة");
  const [code, setCode] = useState("OJI30");
  const [terms, setTerms] = useState("صالح حتى نهاية الشهر · لا يُجمع مع عروض أخرى");
  const [logo, setLogo] = useState("");
  const [store, setStore] = useState("");
  const [primary, setPrimary] = useState("#e11d48");
  const [bg, setBg] = useState("#fff1f2");
  const [exporting, setExporting] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data: p } = await supabase.from("profiles").select("brand_name, brand_colors, brand_logo_url").eq("id", user.id).maybeSingle();
        if (p?.brand_name) setStore(p.brand_name as string);
        const colors = (p?.brand_colors as string[] | null) || [];
        if (colors[0]) setPrimary(colors[0]);
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
      await exportElement(ref.current, { name: `coupon-${code || "oji"}`, format, bg });
      toast.success("تمّ التنزيل 🎉");
    } catch (e) {
      toast.error("تعذّر التصدير", { description: e instanceof Error ? e.message : undefined });
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-start gap-4 mb-6">
        <div className="size-12 rounded-xl bg-primary/10 grid place-items-center text-primary shrink-0">
          <Ticket className="size-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">صانع كوبونات وعروض بصرية</h1>
          <p className="text-muted-foreground mt-1">صمّم كود خصم أنيق جاهز للنشر في ثوانٍ</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <div className="space-y-5">
          <Card className="p-5 space-y-4">
            <div>
              <Label>العنوان الرئيسي</Label>
              <Input value={headline} onChange={(e) => setHeadline(e.target.value)} className="mt-1" placeholder="خصم 30% / اشترِ 1 واحصل على 1" />
            </div>
            <div>
              <Label>السطر الفرعي</Label>
              <Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} className="mt-1" />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label>كود الخصم</Label>
                <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} className="mt-1 uppercase" />
              </div>
              <div>
                <Label>اسم علامتك</Label>
                <Input value={store} onChange={(e) => setStore(e.target.value)} className="mt-1" placeholder="اسم المتجر" />
              </div>
            </div>
            <div>
              <Label>الشروط (اختياري)</Label>
              <Input value={terms} onChange={(e) => setTerms(e.target.value)} className="mt-1" />
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
            <h3 className="font-semibold">الألوان</h3>
            <div className="grid grid-cols-2 gap-3 max-w-xs">
              <ColorField label="أساسي" value={primary} onChange={setPrimary} />
              <ColorField label="الخلفية" value={bg} onChange={setBg} />
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
          <p className="text-xs text-muted-foreground mb-2">معاينة (1080×1080)</p>
          <div className="overflow-auto rounded-xl border shadow-sm">
            <div
              ref={ref}
              dir="rtl"
              style={{
                width: 540,
                height: 540,
                background: bg,
                padding: 40,
                boxSizing: "border-box",
                display: "flex",
                fontFamily: "'Tajawal','Segoe UI',sans-serif",
              }}
            >
              <div
                style={{
                  flex: 1,
                  border: `3px dashed ${primary}`,
                  borderRadius: 20,
                  padding: 32,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "space-between",
                  textAlign: "center",
                  background: "#fff",
                }}
              >
                {logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logo} alt="" style={{ height: 56, objectFit: "contain" }} />
                ) : (
                  <div style={{ fontWeight: 800, fontSize: 20, color: primary }}>{store || "متجرك"}</div>
                )}

                <div>
                  <div style={{ fontSize: 60, fontWeight: 900, color: primary, lineHeight: 1.05 }}>{headline}</div>
                  <div style={{ fontSize: 20, color: "#334155", marginTop: 8, fontWeight: 600 }}>{subtitle}</div>
                </div>

                <div style={{ width: "100%" }}>
                  <div style={{ fontSize: 13, color: "#64748b", marginBottom: 6 }}>استخدم الكود</div>
                  <div
                    style={{
                      display: "inline-block",
                      padding: "12px 32px",
                      borderRadius: 12,
                      background: `linear-gradient(135deg, ${primary}, ${shade(primary, -18)})`,
                      color: "#fff",
                      fontSize: 32,
                      fontWeight: 900,
                      letterSpacing: 3,
                    }}
                  >
                    {code || "CODE"}
                  </div>
                  {terms && <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 14 }}>{terms}</div>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
