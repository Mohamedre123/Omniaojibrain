"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/db";
import { Loader2, Plus, X } from "lucide-react";

export function SettingsForm({ profile, userEmail }: { profile: Profile | null; userEmail: string }) {
  const [pending, startTransition] = useTransition();
  const [colors, setColors] = useState<string[]>(profile?.brand_colors ?? []);
  const [newColor, setNewColor] = useState("#7c3aed");

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
      brand_logo_url: String(fd.get("brand_logo_url") ?? "").trim() || null,
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
        <Label htmlFor="brand_logo_url">رابطُ الشعار (اختياري)</Label>
        <Input
          id="brand_logo_url"
          name="brand_logo_url"
          type="url"
          defaultValue={profile?.brand_logo_url ?? ""}
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
