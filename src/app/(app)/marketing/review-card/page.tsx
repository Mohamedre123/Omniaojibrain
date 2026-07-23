"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ColorField } from "@/components/color-field";
import { exportElement, fileToDataUrl, shade } from "@/lib/canvas-export";
import { createClient } from "@/lib/supabase/client";
import { Quote, Download, Loader2, Upload, Star } from "lucide-react";

export default function ReviewCardPage() {
  const [name, setName] = useState("عميل سعيد");
  const [handle, setHandle] = useState("@customer");
  const [text, setText] = useState("تجربة رائعة من أول طلب! المنتج وصل بسرعة والجودة فوق التوقّعات. أنصح الجميع بالتعامل معهم.");
  const [rating, setRating] = useState(5);
  const [avatar, setAvatar] = useState("");
  const [primary, setPrimary] = useState("#4f6ef7");
  const [bg, setBg] = useState("#0f172a");
  const [textColor, setTextColor] = useState("#f8fafc");
  const [store, setStore] = useState("");
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
      } catch { /* ignore */ }
    })();
  }, []);

  async function onAvatar(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    setAvatar(await fileToDataUrl(file));
  }

  async function doExport(format: "png" | "pdf") {
    if (!ref.current) return;
    setExporting(true);
    try {
      await exportElement(ref.current, { name: `review-${name || "oji"}`, format, bg });
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
          <Quote className="size-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">جرافيك تقييمات العملاء</h1>
          <p className="text-muted-foreground mt-1">حوّل ريفيو عميلك لصورة أنيقة جاهزة للنشر</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <div className="space-y-5">
          <Card className="p-5 space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label>اسم العميل</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>المعرّف (اختياري)</Label>
                <Input value={handle} onChange={(e) => setHandle(e.target.value)} className="mt-1" />
              </div>
            </div>
            <div>
              <Label>نصّ التقييم</Label>
              <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} className="mt-1" />
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <div>
                <Label className="text-xs">التقييم</Label>
                <div className="mt-1 flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} type="button" onClick={() => setRating(n)}>
                      <Star className={`size-6 ${n <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatar} alt="" className="size-12 rounded-full object-cover border" />
                ) : (
                  <div className="size-12 rounded-full border grid place-items-center text-muted-foreground text-lg font-bold">
                    {(name[0] || "؟").toUpperCase()}
                  </div>
                )}
                <label className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm cursor-pointer hover:border-primary">
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => onAvatar(e.target.files?.[0] || null)} />
                  <Upload className="size-4" /> صورة العميل
                </label>
              </div>
            </div>
          </Card>

          <Card className="p-5 space-y-4">
            <h3 className="font-semibold">الألوان</h3>
            <div className="grid grid-cols-3 gap-3">
              <ColorField label="مميّز" value={primary} onChange={setPrimary} />
              <ColorField label="الخلفية" value={bg} onChange={setBg} />
              <ColorField label="النص" value={textColor} onChange={setTextColor} />
            </div>
            <div>
              <Label>اسم علامتك (تذييل)</Label>
              <Input value={store} onChange={(e) => setStore(e.target.value)} className="mt-1" placeholder="اسم المتجر" />
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
                background: `linear-gradient(145deg, ${bg}, ${shade(bg, -18)})`,
                color: textColor,
                padding: 48,
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                fontFamily: "'Tajawal','Segoe UI',sans-serif",
              }}
            >
              <div style={{ fontSize: 90, lineHeight: 0.8, color: primary, fontWeight: 800 }}>&rdquo;</div>
              <div style={{ fontSize: 24, lineHeight: 1.7, fontWeight: 600, flex: 1, display: "flex", alignItems: "center" }}>
                {text}
              </div>
              <div>
                <div style={{ display: "flex", gap: 4, marginBottom: 14 }}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <span key={n} style={{ color: n <= rating ? "#facc15" : "rgba(255,255,255,.25)", fontSize: 24 }}>★</span>
                  ))}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatar} alt="" style={{ width: 52, height: 52, borderRadius: "50%", objectFit: "cover", border: `2px solid ${primary}` }} />
                  ) : (
                    <div style={{ width: 52, height: 52, borderRadius: "50%", background: primary, display: "grid", placeItems: "center", fontSize: 22, fontWeight: 800, color: "#fff" }}>
                      {(name[0] || "؟").toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 18 }}>{name}</div>
                    {handle && <div style={{ fontSize: 14, opacity: 0.6 }}>{handle}</div>}
                  </div>
                  {store && <div style={{ marginInlineStart: "auto", fontSize: 14, fontWeight: 700, color: primary }}>{store}</div>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
