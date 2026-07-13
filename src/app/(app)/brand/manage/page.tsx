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
