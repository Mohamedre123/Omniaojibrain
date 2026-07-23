"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ColorField } from "@/components/color-field";
import { exportElement, fileToDataUrl } from "@/lib/canvas-export";
import { Shirt, Download, Loader2, Upload, Image as ImageIcon } from "lucide-react";

type MockId = "phone" | "browser" | "poster" | "billboard" | "mug" | "tshirt";
const MOCKS: { id: MockId; label: string }[] = [
  { id: "phone", label: "موبايل" },
  { id: "browser", label: "موقع / متصفّح" },
  { id: "poster", label: "بوستر مؤطّر" },
  { id: "billboard", label: "لوحة إعلانية" },
  { id: "mug", label: "مج" },
  { id: "tshirt", label: "تيشيرت" },
];

export default function MockupsPage() {
  const [design, setDesign] = useState("");
  const [mock, setMock] = useState<MockId>("phone");
  const [bg, setBg] = useState("#eef2f7");
  const [garment, setGarment] = useState("#1f2937");
  const [exporting, setExporting] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  async function onDesign(file: File | null) {
    if (!file || !file.type.startsWith("image/")) return;
    if (file.size > 8 * 1024 * 1024) { toast.error("الصورة أكبر من 8MB"); return; }
    setDesign(await fileToDataUrl(file));
  }

  async function doExport(format: "png" | "pdf") {
    if (!ref.current) return;
    if (!design) { toast.error("ارفع تصميمك أولاً"); return; }
    setExporting(true);
    try {
      await exportElement(ref.current, { name: `mockup-${mock}`, format, bg, scale: 2.5 });
      toast.success("تمّ التنزيل 🎉");
    } catch (e) {
      toast.error("تعذّر التصدير", { description: e instanceof Error ? e.message : undefined });
    } finally {
      setExporting(false);
    }
  }

  const surface = (extra: React.CSSProperties): React.CSSProperties => ({
    backgroundImage: design ? `url(${design})` : undefined,
    backgroundColor: design ? undefined : "#cbd5e1",
    backgroundSize: "cover",
    backgroundPosition: "center",
    ...extra,
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-start gap-4 mb-6">
        <div className="size-12 rounded-xl bg-primary/10 grid place-items-center text-primary shrink-0">
          <Shirt className="size-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">مولّد الموكب (Mockups)</h1>
          <p className="text-muted-foreground mt-1">ارفع تصميمك وشوفه على موبايل / موقع / تيشيرت / مج / بوستر / لوحة إعلانية</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <div className="space-y-5">
          <Card className="p-5 space-y-4">
            <div className="flex items-center gap-3">
              {design ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={design} alt="" className="size-16 rounded object-cover border" />
              ) : (
                <div className="size-16 rounded border grid place-items-center text-muted-foreground"><ImageIcon className="size-6" /></div>
              )}
              <label className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm cursor-pointer hover:border-primary">
                <input type="file" accept="image/*" className="hidden" onChange={(e) => onDesign(e.target.files?.[0] || null)} />
                <Upload className="size-4" /> {design ? "تغيير التصميم" : "رفع التصميم"}
              </label>
            </div>

            <div>
              <Label>نوع الموكب</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {MOCKS.map((m) => (
                  <button key={m.id} onClick={() => setMock(m.id)} className={`px-3 py-1.5 rounded-md text-xs border transition-all ${mock === m.id ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:border-primary/50"}`}>
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 max-w-xs">
              <ColorField label="الخلفية" value={bg} onChange={setBg} />
              {(mock === "tshirt" || mock === "mug") && <ColorField label="لون المنتج" value={garment} onChange={setGarment} />}
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
          <p className="text-xs text-muted-foreground mb-2">معاينة</p>
          <div className="overflow-auto rounded-xl border shadow-sm mx-auto w-fit">
            <div
              ref={ref}
              style={{
                width: 520,
                height: 520,
                background: `radial-gradient(circle at 50% 35%, #ffffff, ${bg})`,
                display: "grid",
                placeItems: "center",
                boxSizing: "border-box",
              }}
            >
              {mock === "phone" && (
                <div style={{ width: 210, height: 430, background: "#111", borderRadius: 34, padding: 10, boxShadow: "0 30px 60px rgba(0,0,0,.28)", position: "relative" }}>
                  <div style={surface({ width: "100%", height: "100%", borderRadius: 26 })} />
                  <div style={{ position: "absolute", top: 16, left: "50%", transform: "translateX(-50%)", width: 60, height: 16, background: "#111", borderRadius: 10 }} />
                </div>
              )}

              {mock === "browser" && (
                <div style={{ width: 440, height: 300, background: "#fff", borderRadius: 12, overflow: "hidden", boxShadow: "0 30px 60px rgba(0,0,0,.22)" }}>
                  <div style={{ height: 34, background: "#e5e7eb", display: "flex", alignItems: "center", gap: 6, paddingInline: 12 }}>
                    <span style={{ width: 11, height: 11, borderRadius: "50%", background: "#ef4444" }} />
                    <span style={{ width: 11, height: 11, borderRadius: "50%", background: "#f59e0b" }} />
                    <span style={{ width: 11, height: 11, borderRadius: "50%", background: "#22c55e" }} />
                    <span style={{ marginInlineStart: 14, flex: 1, height: 16, background: "#fff", borderRadius: 8 }} />
                  </div>
                  <div style={surface({ width: "100%", height: "calc(100% - 34px)" })} />
                </div>
              )}

              {mock === "poster" && (
                <div style={{ padding: 18, background: "linear-gradient(135deg,#f8fafc,#cbd5e1)", borderRadius: 4, boxShadow: "0 30px 60px rgba(0,0,0,.28)" }}>
                  <div style={surface({ width: 300, height: 380, border: "10px solid #1f2937", boxSizing: "border-box" })} />
                </div>
              )}

              {mock === "billboard" && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ padding: 12, background: "#374151", borderRadius: 8, boxShadow: "0 24px 40px rgba(0,0,0,.3)" }}>
                    <div style={surface({ width: 400, height: 210 })} />
                  </div>
                  <div style={{ display: "flex", gap: 200, marginTop: 2 }}>
                    <div style={{ width: 14, height: 120, background: "#4b5563" }} />
                    <div style={{ width: 14, height: 120, background: "#4b5563" }} />
                  </div>
                </div>
              )}

              {mock === "mug" && (
                <div style={{ position: "relative", width: 300, height: 240 }}>
                  <div style={{ position: "absolute", right: 40, top: 60, width: 70, height: 90, borderRadius: "50%", border: `18px solid ${garment}`, boxSizing: "border-box" }} />
                  <div style={{ position: "absolute", left: 40, top: 30, width: 200, height: 180, background: garment, borderRadius: 18, boxShadow: "0 24px 40px rgba(0,0,0,.25)", display: "grid", placeItems: "center" }}>
                    <div style={surface({ width: 130, height: 130, borderRadius: 8, boxShadow: "inset 0 0 0 1px rgba(255,255,255,.15)" })} />
                  </div>
                </div>
              )}

              {mock === "tshirt" && (
                <div style={{ position: "relative", width: 340, height: 360 }}>
                  {/* الأكمام */}
                  <div style={{ position: "absolute", left: 8, top: 40, width: 110, height: 90, background: garment, borderRadius: "30px 8px 40px 30px", transform: "rotate(18deg)" }} />
                  <div style={{ position: "absolute", right: 8, top: 40, width: 110, height: 90, background: garment, borderRadius: "8px 30px 30px 40px", transform: "rotate(-18deg)" }} />
                  {/* الجسم */}
                  <div style={{ position: "absolute", left: 70, top: 30, width: 200, height: 300, background: garment, borderRadius: "0 0 24px 24px", boxShadow: "0 24px 40px rgba(0,0,0,.22)" }} />
                  {/* الرقبة */}
                  <div style={{ position: "absolute", left: "50%", top: 22, transform: "translateX(-50%)", width: 70, height: 34, background: "#0000", border: `10px solid ${garment}`, borderRadius: "0 0 40px 40px", boxSizing: "border-box" }} />
                  {/* التصميم على الصدر */}
                  <div style={surface({ position: "absolute", left: "50%", top: 110, transform: "translateX(-50%)", width: 120, height: 140, borderRadius: 4 })} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
