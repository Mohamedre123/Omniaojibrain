"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/db";
import { Loader2, Plus, X, Upload } from "lucide-react";

export function SettingsForm({ profile, userEmail }: { profile: Profile | null; userEmail: string }) {
  const [pending, startTransition] = useTransition();
  const [colors, setColors] = useState<string[]>(profile?.brand_colors ?? []);
  const [newColor, setNewColor] = useState("#7c3aed");
  const [logoUrl, setLogoUrl] = useState<string>(profile?.brand_logo_url ?? "");
  const [uploadingLogo, setUploadingLogo] = useState(false);

  async function handleLogoUpload(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("الملف لازم يكون صورة"); return; }
    if (file.size > 4 * 1024 * 1024) { toast.error("الشعار أكبر من 4MB"); return; }
    setUploadingLogo(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error("سجّل الدخول أولاً"); return; }
      const ext = file.type.includes("png") ? "png" : file.type.includes("svg") ? "svg" : file.type.includes("webp") ? "webp" : "jpg";
      const path = `${user.id}/brand/logo-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("uploads").upload(path, file, { contentType: file.type, upsert: true });
      if (upErr) { toast.error("تعذّر رفع الشعار", { description: upErr.message }); return; }
      const { data: signed } = await supabase.storage.from("uploads").createSignedUrl(path, 31536000);
      if (signed?.signedUrl) {
        setLogoUrl(signed.signedUrl);
        toast.success("اترفع الشعار ✓ — اضغط حفظ الإعدادات");
      }
    } catch {
      toast.error("تعذّر رفع الشعار");
    } finally {
      setUploadingLogo(false);
    }
  }

  function addColor() {
    if (colors.length >= 6) return;
    if (colors.includes(newColor)) return;
    setColors([...colors, newColor]);
  }

  function removeColor(c: string) {
    setColors(colors.filter((x) => x !== c));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const updates = {
      full_name: String(fd.get("full_name") ?? "").trim() || null,
      brand_name: String(fd.get("brand_name") ?? "").trim() || null,
      brand_voice: String(fd.get("brand_voice") ?? "").trim() || null,
      brand_logo_url: logoUrl.trim() || null,
      brand_colors: colors,
      updated_at: new Date().toISOString(),
    };

    startTransition(async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from("profiles").upsert({ id: user.id, ...updates });

      if (error) {
        toast.error("حدثت مشكلة", { description: error.message });
        return;
      }
      toast.success("تمّ الحفظ ✓");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="full_name">اسمك</Label>
        <Input id="full_name" name="full_name" defaultValue={profile?.full_name ?? ""} placeholder="اسمك الكامل" />
      </div>

      <div className="space-y-2">
        <Label>البريد الإلكتروني</Label>
        <Input value={userEmail} disabled className="opacity-60" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="brand_name">اسمُ العلامة التجارية</Label>
        <Input id="brand_name" name="brand_name" defaultValue={profile?.brand_name ?? ""} placeholder="مثلاً: Oji Studio" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="brand_voice">نبرةُ العلامة التجارية</Label>
        <Textarea
          id="brand_voice"
          name="brand_voice"
          defaultValue={profile?.brand_voice ?? ""}
          placeholder="مثلاً: نبرةٌ وديةٌ مرحة، تخاطبُ الشباب من 18-30، تستخدمُ لغةً عصريةً وتتجنّبُ الرسميةَ الجامدة..."
          rows={4}
        />
        <p className="text-xs text-muted-foreground">
          كلّما كان الوصفُ أوضح، فهم Oji علامتك بشكلٍ أفضل.
        </p>
      </div>

      <div className="space-y-2">
        <Label>ألوانُ العلامة التجارية</Label>
        <div className="flex flex-wrap gap-2">
          {colors.map((c) => (
            <div key={c} className="group relative">
              <div className="size-10 rounded-lg border-2 border-white shadow-md" style={{ backgroundColor: c }} />
              <button
                type="button"
                onClick={() => removeColor(c)}
                className="absolute -top-1 -right-1 size-5 rounded-full bg-destructive text-white grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="حذفُ اللون"
              >
                <X className="size-3" />
              </button>
              <p className="text-[10px] font-mono text-center mt-1">{c}</p>
            </div>
          ))}
          {colors.length < 6 && (
            <div className="flex items-center gap-1">
              <input
                type="color"
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                className="size-10 rounded-lg border cursor-pointer"
              />
              <Button type="button" variant="outline" size="icon" onClick={addColor}>
                <Plus className="size-4" />
              </Button>
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground">حتى ستةِ ألوانٍ كحدٍّ أقصى</p>
      </div>

      <div className="space-y-2">
        <Label>شعارُ العلامة (يُستخدم كمرجع ألوان في الاستوديو)</Label>
        <div className="flex items-center gap-3 flex-wrap">
          {logoUrl ? (
            <div className="relative group shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logoUrl} alt="الشعار" className="size-20 rounded-lg border object-contain bg-white p-1" />
              <button
                type="button"
                onClick={() => setLogoUrl("")}
                className="absolute -top-1 -right-1 size-5 rounded-full bg-destructive text-white grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="حذفُ الشعار"
              >
                <X className="size-3" />
              </button>
            </div>
          ) : (
            <div className="size-20 rounded-lg border-2 border-dashed grid place-items-center text-muted-foreground shrink-0">
              <Upload className="size-5" />
            </div>
          )}
          <label className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm cursor-pointer hover:border-primary transition-colors ${uploadingLogo ? "opacity-50 pointer-events-none" : ""}`}>
            <input type="file" accept="image/*" className="hidden" disabled={uploadingLogo} onChange={(e) => handleLogoUpload(e.target.files?.[0] || null)} />
            {uploadingLogo ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
            {logoUrl ? "تغيير الشعار" : "رفع الشعار"}
          </label>
        </div>

        <Label htmlFor="brand_logo_url" className="text-xs text-muted-foreground pt-1">أو الصق رابطاً مباشراً</Label>
        <Input
          id="brand_logo_url"
          type="url"
          value={logoUrl}
          onChange={(e) => setLogoUrl(e.target.value)}
          placeholder="https://..."
        />
      </div>

      <Button type="submit" variant="gradient" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        حفظُ الإعدادات
      </Button>
    </form>
  );
}
