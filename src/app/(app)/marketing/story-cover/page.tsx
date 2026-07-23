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
import { LayoutTemplate, Download, Loader2, Upload, Trash2 } from "lucide-react";

type Align = "top" | "center" | "bottom";

export default function StoryCoverPage() {
  const [badge, setBadge] = useState("جديد");
  const [title, setTitle] = useState("عرض الأسبوع");
  const [subtitle, setSubtitle] = useState("لا يفوتك — الكمية محدودة");
  const [store, setStore] = useState("");
  const [photo, setPhoto] = useState("");
  const [logo, setLogo] = useState("");
  const [primary, setPrimary] = useState("#7c3aed");
  const [accent, setAccent] = useState("#f472b6");
  const [textColor, setTextColor] = useState("#ffffff");
  const [align, setAlign] = useState<Align>("bottom");
  const [exporting, setExporting] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data: p } = await supabase.from("profiles").select("brand_name, brand_colors").eq("id", user.id).maybeSingle();
        if (p?.brand_name) setStore(p.brand_name as string);
        const colors = (p?.brand_colors as string[] | null) || [];
        if (colors[0]) setPrimary(colors[0]);
        if (colors[1]) setAccent(colors[1]);
      } catch { /* ignore */ }
    })();
  }, []);

  async function onFile(file: File | null, set: (v: string) => void) {
    if (!file || !file.type.startsWith("image/")) return;
    set(await fileToDataUrl(file));
  }

  async function doExport(format: "png" | "pdf") {
    if (!ref.current) return;
    setExporting(true);
    try {
      await exportElement(ref.current, { name: `story-${title || "oji"}`, format, bg: primary });
      toast.success("تمّ التنزيل 🎉");
    } catch (e) {
      toast.error("تعذّر التصدير", { description: e instanceof Error ? e.message : undefined });
    } finally {
      setExporting(false);
    }
  }

  const justify = align === "top" ? "flex-start" : align === "center" ? "center" : "flex-end";

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-start gap-4 mb-6">
        <div className="size-12 rounded-xl bg-primary/10 grid place-items-center text-primary shrink-0">
          <LayoutTemplate className="size-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">مولّد أغلفة ستوري / ريلز</h1>
          <p className="text-muted-foreground mt-1">غلاف احترافي بمقاس 9:16 لكل قصصك وريلزك</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <div className="space-y-5">
          <Card className="p-5 space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label>الشارة (Badge)</Label>
                <Input value={badge} onChange={(e) => setBadge(e.target.value)} className="mt-1" placeholder="جديد / عرض / حصري" />
              </div>
              <div>
                <Label>اسم علامتك</Label>
                <Input value={store} onChange={(e) => setStore(e.target.value)} className="mt-1" />
              </div>
            </div>
            <div>
              <Label>العنوان</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>السطر الفرعي</Label>
              <Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} className="mt-1" />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm cursor-pointer hover:border-primary">
                <input type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0] || null, setPhoto)} />
                <Upload className="size-4" /> {photo ? "تغيير الخلفية" : "صورة خلفية"}
              </label>
              {photo && (
                <Button variant="ghost" size="sm" onClick={() => setPhoto("")}>
                  <Trash2 className="size-4" /> إزالة الخلفية
                </Button>
              )}
              <label className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm cursor-pointer hover:border-primary">
                <input type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0] || null, setLogo)} />
                <Upload className="size-4" /> {logo ? "تغيير اللوجو" : "لوجو"}
              </label>
            </div>
          </Card>

          <Card className="p-5 space-y-4">
            <h3 className="font-semibold">الألوان والمحاذاة</h3>
            <div className="grid grid-cols-3 gap-3">
              <ColorField label="أساسي" value={primary} onChange={setPrimary} />
              <ColorField label="مميّز" value={accent} onChange={setAccent} />
              <ColorField label="النص" value={textColor} onChange={setTextColor} />
            </div>
            <div className="max-w-xs">
              <Label>مكان النص</Label>
              <select value={align} onChange={(e) => setAlign(e.target.value as Align)} className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                <option value="top">أعلى</option>
                <option value="center">وسط</option>
                <option value="bottom">أسفل</option>
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
          <p className="text-xs text-muted-foreground mb-2">معاينة (1080×1920 · 9:16)</p>
          <div className="overflow-auto rounded-xl border shadow-sm mx-auto w-fit">
            <div
              ref={ref}
              dir="rtl"
              style={{
                width: 324,
                height: 576,
                position: "relative",
                overflow: "hidden",
                background: photo ? "#000" : `linear-gradient(160deg, ${primary}, ${shade(accent, -10)})`,
                color: textColor,
                fontFamily: "'Tajawal','Segoe UI',sans-serif",
              }}
            >
              {photo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photo} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
              )}
              {/* overlay للتباين */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: photo
                    ? `linear-gradient(to top, rgba(0,0,0,.75), rgba(0,0,0,.15) 55%, rgba(0,0,0,.35))`
                    : "transparent",
                }}
              />
              <div style={{ position: "absolute", inset: 0, padding: 28, display: "flex", flexDirection: "column", justifyContent: justify }}>
                {logo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logo} alt="" style={{ height: 44, objectFit: "contain", position: "absolute", top: 24, insetInlineStart: 24 }} />
                )}
                <div>
                  {badge && (
                    <span style={{ display: "inline-block", background: accent, color: "#fff", fontSize: 13, fontWeight: 800, padding: "5px 14px", borderRadius: 999, marginBottom: 14 }}>
                      {badge}
                    </span>
                  )}
                  <div style={{ fontSize: 40, fontWeight: 900, lineHeight: 1.15, textShadow: "0 2px 12px rgba(0,0,0,.35)" }}>{title}</div>
                  {subtitle && <div style={{ fontSize: 18, marginTop: 10, opacity: 0.92, fontWeight: 600, textShadow: "0 1px 8px rgba(0,0,0,.35)" }}>{subtitle}</div>}
                  {store && <div style={{ fontSize: 15, marginTop: 18, fontWeight: 700, color: accent }}>{store}</div>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
