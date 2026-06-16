"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader,
  DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { BUSINESS_TEMPLATES } from "@/lib/templates";
import { createClient } from "@/lib/supabase/client";
import { Plus, Loader2, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";

const COLORS = ["violet", "blue", "emerald", "orange", "rose"] as const;
const COLOR_BG: Record<string, string> = {
  violet: "bg-gradient-to-br from-violet-500 to-purple-600",
  blue: "bg-gradient-to-br from-blue-500 to-cyan-600",
  emerald: "bg-gradient-to-br from-emerald-500 to-teal-600",
  orange: "bg-gradient-to-br from-orange-500 to-pink-600",
  rose: "bg-gradient-to-br from-rose-500 to-fuchsia-600",
};

export function NewProjectDialog({ children }: { children?: React.ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [businessType, setBusinessType] = useState("general");
  const [color, setColor] = useState<string>("violet");
  const [magicUrl, setMagicUrl] = useState("");
  const [magicLoading, setMagicLoading] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const briefRef = useRef<HTMLTextAreaElement>(null);

  async function runMagicBrief() {
    if (!magicUrl.trim()) {
      toast.error("أدخل الرابط أولاً");
      return;
    }
    setMagicLoading(true);
    try {
      const res = await fetch("/api/magic-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: magicUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "حدثت مشكلة");
        return;
      }

      // 🎨 ألوان الهوية المكتشفة
      const colors: string[] = Array.isArray(data.brand_colors)
        ? data.brand_colors.filter((c: unknown) => typeof c === "string" && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(c)).slice(0, 4)
        : [];

      // املا الفورم تلقائي
      if (nameRef.current && data.brand_name) nameRef.current.value = data.brand_name;
      if (briefRef.current) {
        const lines = [
          data.brief && `${data.brief}`,
          data.audience && `\n**الجمهورُ المستهدف:** ${data.audience}`,
          data.tone && `\n**النبرة:** ${data.tone}`,
          colors.length > 0 && `\n**ألوانُ الهوية:** ${colors.join("، ")}`,
          data.key_points?.length > 0 && `\n**نقاطُ التميّز:**\n${data.key_points.map((p: string) => `- ${p}`).join("\n")}`,
        ].filter(Boolean).join("\n");
        briefRef.current.value = lines;
      }

      // 💾 احفظ الهوية في "هويتي" (البروفايل) عشان الاستوديو يستخدمها لما تفعّل "هويتي"
      let savedIdentity = false;
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const patch: Record<string, unknown> = {};
          if (data.brand_name) patch.brand_name = data.brand_name;
          if (data.tone) patch.brand_voice = data.tone;
          if (colors.length > 0) patch.brand_colors = colors;
          if (Object.keys(patch).length > 0) {
            const { error: upErr } = await supabase.from("profiles").update(patch).eq("id", user.id);
            savedIdentity = !upErr && colors.length > 0;
          }
        }
      } catch {
        // تجاهل — حفظ الهوية اختياري
      }

      // خمن نوع البزنس
      const type = String(data.business_type ?? "").toLowerCase();
      const mapping: Record<string, string> = {
        مطعم: "restaurant", كافيه: "restaurant", restaurant: "restaurant",
        عيادة: "clinic", مركز: "clinic", clinic: "clinic", طبي: "clinic",
        ملابس: "fashion", أزياء: "fashion", fashion: "fashion",
        أكاديمية: "academy", تعليم: "academy", education: "academy", course: "academy",
        متجر: "ecommerce", ecommerce: "ecommerce", shop: "ecommerce",
        عقارات: "realestate", realestate: "realestate", real: "realestate",
        جيم: "fitness", لياقة: "fitness", fitness: "fitness",
        تطبيق: "saas", saas: "saas", software: "saas",
      };
      for (const [k, v] of Object.entries(mapping)) {
        if (type.includes(k)) { setBusinessType(v); break; }
      }

      toast.success(
        savedIdentity ? "جاهز! وحفظنا ألوان الهوية في «هويتي» 🎨" : "جاهز! راجِع البيانات وعدّل ما تشاء ✨",
        savedIdentity ? { description: "فعّل «هويتي» في الاستوديو عشان التصاميم تطلع بألوان العلامة" } : undefined
      );
    } catch {
      toast.error("تعذّر الاتصال");
    } finally {
      setMagicLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") ?? "").trim();
    const brief = String(fd.get("brief") ?? "").trim();

    if (!name) {
      toast.error("اسمُ المشروع مطلوب");
      return;
    }

    startTransition(async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("يجب تسجيل الدخول أولاً");
        return;
      }

      const { data, error } = await supabase
        .from("projects")
        .insert({
          user_id: user.id,
          name,
          brief: brief || null,
          business_type: businessType,
          cover_color: color,
        })
        .select()
        .single();

      if (error) {
        toast.error("حدثت مشكلة", { description: error.message });
        return;
      }

      toast.success("تمّ إنشاءُ المشروع 🎉");
      setOpen(false);
      router.push(`/projects/${data.id}`);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ?? (
          <Button variant="gradient">
            <Plus className="size-4" />
            مشروع جديد
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>مشروع جديد ✨</DialogTitle>
          <DialogDescription>
            احكي بريف مختصر عن المشروع، واختار نوع البزنس عشان Oji Brain يفهمك أحسن.
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 p-3 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Wand2 className="size-4 text-primary" />
            ✨ Magic Brief — تحليلٌ تلقائيٌّ لرابطٍ مّا
          </div>
          <p className="text-xs text-muted-foreground">
            أدخل رابطَ موقع العميل أو صفحةَ المنتج، وسيقوم Oji بملءِ البيانات تلقائياً
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="https://example.com"
              type="url"
              value={magicUrl}
              onChange={(e) => setMagicUrl(e.target.value)}
              disabled={magicLoading}
            />
            <Button type="button" variant="gradient" onClick={runMagicBrief} disabled={magicLoading} className="shrink-0 w-full sm:w-auto">
              {magicLoading ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />}
              تحليل
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name">اسم المشروع</Label>
            <Input id="name" name="name" ref={nameRef} placeholder="مثلاً: حملة إطلاق مطعم الجلسة" required />
          </div>

          <div className="space-y-2">
            <Label>نوعُ النشاط</Label>
            <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1">
              {BUSINESS_TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setBusinessType(t.id)}
                  className={cn(
                    "rounded-lg border p-3 text-right transition-all hover:border-primary/50",
                    businessType === t.id && "border-primary bg-primary/5 ring-2 ring-primary/20"
                  )}
                >
                  <div className="text-2xl mb-1">{t.emoji}</div>
                  <div className="text-xs font-medium">{t.name}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="brief">وصفُ المشروع (اختياري)</Label>
            <Textarea
              id="brief"
              name="brief"
              ref={briefRef}
              placeholder="اشرح المشروع، المنتج، الجمهور المستهدف، وأيّ تفاصيلَ تريد Oji أن يعرفها..."
              rows={5}
            />
          </div>

          <div className="space-y-2">
            <Label>لونُ البطاقة</Label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    "size-10 rounded-lg transition-all",
                    COLOR_BG[c],
                    color === c ? "ring-2 ring-offset-2 ring-primary scale-110" : "hover:scale-105"
                  )}
                  aria-label={c}
                />
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" variant="gradient" disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              إنشاء المشروع
            </Button>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>إلغاء</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
