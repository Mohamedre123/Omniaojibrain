"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { Sparkles, Loader2, Check, Trash2, Plus, ArrowRight } from "lucide-react";

type Brand = {
  id: string;
  name: string;
  brand_name: string | null;
  brand_voice: string | null;
  brand_colors: string[];
  brand_logo_url: string | null;
};

export default function BrandManagePage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newName, setNewName] = useState("");
  const [activeName, setActiveName] = useState<string>("");
  const [needsTable, setNeedsTable] = useState(false);

  async function load() {
    const supabase = createClient();
    const { data, error } = await supabase.from("brands").select("*").order("created_at", { ascending: false });
    if (error) {
      setNeedsTable(true);
      setLoading(false);
      return;
    }
    setBrands((data as Brand[]) || []);
    // العلامة المفعّلة حالياً (من البروفايل)
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: p } = await supabase.from("profiles").select("brand_name").eq("id", user.id).maybeSingle();
      setActiveName((p?.brand_name as string) || "");
    }
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  async function saveCurrent() {
    const name = newName.trim();
    if (!name) { toast.error("اكتب اسماً لهذه العلامة"); return; }
    setSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: p } = await supabase
        .from("profiles")
        .select("brand_name, brand_voice, brand_colors, brand_logo_url")
        .eq("id", user.id)
        .maybeSingle();
      const { error } = await supabase.from("brands").insert({
        user_id: user.id,
        name,
        brand_name: p?.brand_name ?? null,
        brand_voice: p?.brand_voice ?? null,
        brand_colors: p?.brand_colors ?? [],
        brand_logo_url: p?.brand_logo_url ?? null,
      });
      if (error) { toast.error("تعذّر الحفظ", { description: error.message }); return; }
      toast.success("اتحفظت علامتك الحالية ✓");
      setNewName("");
      void load();
    } finally {
      setSaving(false);
    }
  }

  async function activate(b: Brand) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("profiles").update({
      brand_name: b.brand_name,
      brand_voice: b.brand_voice,
      brand_colors: b.brand_colors ?? [],
      brand_logo_url: b.brand_logo_url,
      updated_at: new Date().toISOString(),
    }).eq("id", user.id);
    if (error) { toast.error("تعذّر التفعيل", { description: error.message }); return; }
    setActiveName(b.brand_name || "");
    toast.success(`تم تفعيل «${b.name}» — كل التوليد هيستخدمها الآن`);
  }

  async function remove(b: Brand) {
    const supabase = createClient();
    const { error } = await supabase.from("brands").delete().eq("id", b.id);
    if (error) { toast.error("تعذّر الحذف"); return; }
    setBrands((prev) => prev.filter((x) => x.id !== b.id));
    toast.success("اتحذفت");
  }

  async function exportPDF() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: p } = await supabase.from("profiles").select("brand_name, brand_voice, brand_colors, brand_logo_url").eq("id", user.id).maybeSingle();
    const W = 794, H = 1123;
    const c = document.createElement("canvas"); c.width = W; c.height = H;
    const ctx = c.getContext("2d"); if (!ctx) return;

    const colors = (p?.brand_colors as string[]) || [];
    const primary = colors[0] || "#4f6ef7";

    // خلفية + شريط علوي بلون العلامة
    ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = primary; ctx.fillRect(0, 0, W, 150);
    ctx.direction = "rtl"; ctx.textAlign = "right";
    ctx.fillStyle = "#ffffff"; ctx.font = "bold 38px sans-serif";
    ctx.fillText("دليل الهوية — Brand Guide", W - 50, 72);
    ctx.font = "24px sans-serif";
    ctx.fillText((p?.brand_name as string) || "علامتي", W - 50, 112);

    // الشعار في يسار الهيدر (fetch→dataURL لتفادي تلويث الـ canvas)
    try {
      const url = p?.brand_logo_url as string | null;
      if (url) {
        const blob = await (await fetch(url)).blob();
        const durl = await new Promise<string>((res) => { const r = new FileReader(); r.onload = () => res(r.result as string); r.onerror = () => res(""); r.readAsDataURL(blob); });
        if (durl) {
          const img = await new Promise<HTMLImageElement | null>((res) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = durl; });
          if (img) { ctx.fillStyle = "#fff"; ctx.fillRect(46, 30, 94, 94); ctx.drawImage(img, 50, 34, 86, 86); }
        }
      }
    } catch { /* تجاهل */ }

    let y = 230;

    // 🎨 الألوان — عيّنات مع HEX ودور كل لون
    ctx.textAlign = "right"; ctx.fillStyle = "#111827"; ctx.font = "bold 28px sans-serif";
    ctx.fillText("🎨 الألوان", W - 50, y); y += 30;
    if (colors.length) {
      const roles = ["أساسي", "مميّز", "خلفية", "نصّ", "تمييز"];
      const sw = 120, gap = 20, startX = 50;
      colors.slice(0, 5).forEach((col, i) => {
        const x = startX + i * (sw + gap);
        ctx.fillStyle = col; ctx.fillRect(x, y, sw, sw);
        ctx.strokeStyle = "#e5e7eb"; ctx.lineWidth = 1; ctx.strokeRect(x, y, sw, sw);
        ctx.textAlign = "center";
        ctx.fillStyle = "#111827"; ctx.font = "bold 15px monospace";
        ctx.fillText((col || "").toUpperCase(), x + sw / 2, y + sw + 22);
        ctx.fillStyle = "#6b7280"; ctx.font = "13px sans-serif";
        ctx.fillText(roles[i] || "", x + sw / 2, y + sw + 42);
      });
      y += sw + 80;
    } else {
      ctx.fillStyle = "#9ca3af"; ctx.font = "18px sans-serif"; ctx.textAlign = "right";
      ctx.fillText("لم تُحدَّد ألوان بعد — أضِفها من الإعدادات.", W - 50, y + 10); y += 60;
    }

    // 🗣️ النبرة (مع لفّ النصّ)
    ctx.textAlign = "right"; ctx.fillStyle = "#111827"; ctx.font = "bold 28px sans-serif";
    ctx.fillText("🗣️ نبرة العلامة", W - 50, y); y += 38;
    ctx.font = "20px sans-serif"; ctx.fillStyle = "#374151";
    const voice = (p?.brand_voice as string) || "لم تُحدَّد بعد.";
    const words = voice.split(/\s+/); let line = ""; const maxW = W - 100;
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (ctx.measureText(test).width > maxW) { ctx.fillText(line, W - 50, y); y += 30; line = w; }
      else line = test;
    }
    if (line) { ctx.fillText(line, W - 50, y); y += 30; }
    y += 40;

    // 🔤 الخطوط + 🧭 إرشادات (توصيات ثابتة مفيدة)
    ctx.fillStyle = "#111827"; ctx.font = "bold 28px sans-serif"; ctx.fillText("🔤 الخطوط", W - 50, y); y += 36;
    ctx.font = "19px sans-serif"; ctx.fillStyle = "#374151";
    ctx.fillText("العناوين: Tajawal / Cairo (عريض) — النصوص: Tajawal (عادي)، مريح للقراءة.", W - 50, y); y += 60;

    ctx.fillStyle = "#111827"; ctx.font = "bold 28px sans-serif"; ctx.fillText("🧭 إرشادات الاستخدام", W - 50, y); y += 36;
    ctx.font = "19px sans-serif"; ctx.fillStyle = "#16a34a";
    ctx.fillText("✓ استخدم الألوان بثبات · اترك مساحات بيضاء · التزم بخطّين كحدّ أقصى.", W - 50, y); y += 30;
    ctx.fillStyle = "#dc2626";
    ctx.fillText("✗ لا تشوّه الشعار · لا تخلط ألواناً خارج اللوحة · لا تزحم التصميم.", W - 50, y);

    // تذييل
    ctx.fillStyle = "#9ca3af"; ctx.font = "18px sans-serif"; ctx.textAlign = "right";
    ctx.fillText("Oji Brain — oji-brain.site", W - 50, H - 50);

    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "px", format: [W, H] });
      doc.addImage(c.toDataURL("image/png"), "PNG", 0, 0, W, H);
      doc.save("oji-brand-guide.pdf");
    } catch {
      toast.error("تعذّر التصدير");
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <Sparkles className="size-7 text-primary" /> علاماتي المتعددة
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">احفظ أكثر من علامة (لعملاء مختلفين) وفعّل أيّها بضغطة — والموقع كله يشتغل عليها.</p>
        </div>
        <Link href="/settings" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary shrink-0">
          <ArrowRight className="size-4" /> الإعدادات
        </Link>
      </div>

      {needsTable ? (
        <Card className="p-5 text-sm">
          <p className="font-semibold mb-1">⚠️ الميزة تحتاج تفعيلاً بسيطاً</p>
          <p className="text-muted-foreground">شغّل كود SQL الخاص بجدول <code>brands</code> في Supabase مرة واحدة، ثم حدّث الصفحة.</p>
        </Card>
      ) : (
        <>
          <Card className="p-5 mb-5">
            <Label htmlFor="bn">احفظ علامتك الحالية كعلامة جديدة</Label>
            <div className="mt-2 flex flex-col sm:flex-row gap-2">
              <Input id="bn" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="اسم العلامة (مثلاً: عميل متجر الورد)" />
              <Button onClick={saveCurrent} disabled={saving || !newName.trim()} variant="gradient" className="shrink-0 w-full sm:w-auto">
                {saving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />} حفظ
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">بيحفظ بيانات الهوية الحالية من الإعدادات (الاسم، النبرة، الألوان، الشعار).</p>
            <Button onClick={exportPDF} variant="outline" className="w-full mt-3">📄 تصدير دليل الهوية PDF</Button>
            <Link href="/brand/wizard" className="mt-2 block text-center text-xs text-primary hover:underline">
              ✨ مش متأكّد من هويتك؟ ولّد كتاب علامة كامل بالـ AI
            </Link>
          </Card>

          {loading ? (
            <div className="grid place-items-center py-10"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
          ) : brands.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">لسه مفيش علامات محفوظة. اظبط هويتك في الإعدادات واحفظها هنا باسم.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {brands.map((b) => {
                const active = !!b.brand_name && b.brand_name === activeName;
                return (
                  <Card key={b.id} className={`p-4 ${active ? "ring-2 ring-primary" : ""}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-semibold truncate">{b.name}</h3>
                        {b.brand_name && <p className="text-xs text-muted-foreground truncate">{b.brand_name}</p>}
                      </div>
                      {active && <span className="text-[10px] rounded-full bg-primary/15 text-primary px-2 py-0.5 shrink-0">مفعّلة</span>}
                    </div>
                    {b.brand_colors && b.brand_colors.length > 0 && (
                      <div className="flex gap-1.5 mt-3">
                        {b.brand_colors.slice(0, 6).map((c, i) => (
                          <span key={i} className="size-5 rounded-md border" style={{ backgroundColor: c }} />
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-4">
                      <Button onClick={() => activate(b)} disabled={active} variant={active ? "outline" : "gradient"} size="sm" className="flex-1">
                        <Check className="size-3.5" /> {active ? "مفعّلة" : "تفعيل"}
                      </Button>
                      <Button onClick={() => remove(b)} variant="ghost" size="icon" className="text-destructive shrink-0">
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
