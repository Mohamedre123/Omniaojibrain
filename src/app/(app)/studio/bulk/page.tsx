"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Layers, Loader2, Download, FolderOpen, ArrowRight } from "lucide-react";
import { saveImageToLibrary } from "@/lib/media-library";

type Item = { prompt: string; status: "pending" | "loading" | "done" | "error"; src?: string; error?: string };

const ASPECTS = [
  { label: "مربّع 1:1", value: "1:1" },
  { label: "بورتريه 4:5", value: "4:5" },
  { label: "ستوري 9:16", value: "9:16" },
  { label: "أفقي 16:9", value: "16:9" },
];

export default function BulkPage() {
  const [text, setText] = useState("");
  const [aspect, setAspect] = useState("1:1");
  const [items, setItems] = useState<Item[]>([]);
  const [busy, setBusy] = useState(false);

  async function generateOne(prompt: string, setLocal: (patch: Partial<Item>) => void) {
    try {
      const res = await fetch("/api/image-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: `${prompt}. Aspect ratio: ${aspect}.`, aspect, quality: "fast", provider: "gemini" }),
      });
      if (res.status === 401) {
        setLocal({ status: "error", error: "انتهت الجلسة" });
        return;
      }
      const data = await res.json();
      if (!res.ok || !data.images?.length) {
        setLocal({ status: "error", error: data.error || "فشل" });
        return;
      }
      const img = data.images[0] as { data: string; mimeType: string };
      setLocal({ status: "done", src: `data:${img.mimeType};base64,${img.data}` });
      void saveImageToLibrary(img.data, img.mimeType);
    } catch {
      setLocal({ status: "error", error: "تعذّر الاتصال" });
    }
  }

  async function generate() {
    const prompts = text.split("\n").map((l) => l.trim()).filter(Boolean).slice(0, 8);
    if (prompts.length === 0) { toast.error("اكتب وصفاً واحداً على الأقل (سطر لكل صورة)"); return; }
    setBusy(true);
    const init: Item[] = prompts.map((p) => ({ prompt: p, status: "loading" }));
    setItems(init);

    await Promise.all(
      prompts.map((p, i) =>
        generateOne(p, (patch) =>
          setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)))
        )
      )
    );
    setBusy(false);
    toast.success("خلص التوليد — كله اتحفظ في ملفاتي");
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <Layers className="size-7 text-primary" /> توليد بالجملة
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">اكتب وصفاً في كل سطر (حتى 8 صور)، وولّدها كلها دفعة واحدة.</p>
        </div>
        <Link href="/studio" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary shrink-0">
          <ArrowRight className="size-4" /> الاستوديو
        </Link>
      </div>

      <Card className="p-5 space-y-4">
        <div>
          <Label htmlFor="prompts">الأوصاف (سطر لكل صورة)</Label>
          <Textarea
            id="prompts"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={"كوب قهوة على رخام\nعصير برتقال طازج\nكيكة شوكولاتة فاخرة"}
            rows={6}
            className="mt-1"
            dir="auto"
          />
        </div>
        <div>
          <Label>الأبعاد</Label>
          <div className="mt-1 flex flex-wrap gap-2">
            {ASPECTS.map((a) => (
              <button key={a.value} onClick={() => setAspect(a.value)} className={`px-3 py-1.5 rounded-md text-xs border transition-all ${aspect === a.value ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:border-primary/50"}`}>
                {a.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={generate} disabled={busy} variant="gradient" size="lg" className="flex-1">
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Layers className="size-4" />}
            {busy ? "جاري التوليد…" : "توليد الكل"}
          </Button>
          <Link href="/studio/library" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary">
            <FolderOpen className="size-4" /> ملفاتي
          </Link>
        </div>
      </Card>

      {items.length > 0 && (
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {items.map((it, i) => (
            <Card key={i} className="p-2 overflow-hidden">
              {it.status === "done" && it.src ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={it.src} alt={it.prompt} className="w-full rounded-lg aspect-square object-cover" />
                  <div className="flex items-center justify-between mt-1.5 px-1">
                    <span className="text-[11px] text-muted-foreground truncate">{it.prompt}</span>
                    <a href={it.src} download={`oji-${i}.png`} className="text-primary shrink-0"><Download className="size-4" /></a>
                  </div>
                </>
              ) : (
                <div className="aspect-square rounded-lg grid place-items-center text-center p-2 bg-muted/40">
                  {it.status === "error" ? (
                    <span className="text-xs text-destructive">⚠️ {it.error}</span>
                  ) : (
                    <Loader2 className="size-5 animate-spin text-muted-foreground" />
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
