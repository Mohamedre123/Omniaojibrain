"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Film, Sparkles, Loader2, Copy, Info, ExternalLink } from "lucide-react";

const PLATFORMS = [
  { name: "Veo (Google)", url: "https://aitestkitchen.withgoogle.com/tools/video-fx", free: false },
  { name: "Runway Gen-3", url: "https://runwayml.com", free: false },
  { name: "Kling AI", url: "https://kling.kuaishou.com", free: true },
  { name: "Pika Labs", url: "https://pika.art", free: true },
  { name: "Hailuo AI", url: "https://hailuoai.video", free: true },
];

export default function VideoGenPage() {
  const [scene, setScene] = useState("");
  const [duration, setDuration] = useState("8s");
  const [aspect, setAspect] = useState("9:16");
  const [model, setModel] = useState("Veo");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  async function generate() {
    if (!scene.trim()) { toast.error("اكتب وصف المشهد"); return; }
    setLoading(true);
    setResult("");

    const input = `**وصف المشهد**: ${scene}
**النموذج**: ${model}
**المدّة**: ${duration}
**نسبة الأبعاد**: ${aspect}`;

    try {
      const res = await fetch("/api/generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool: "video_prompt_advanced", input }),
      });

      if (!res.ok || !res.body) { toast.error("حدثت مشكلة"); setLoading(false); return; }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setResult(acc);
      }
    } catch { toast.error("تعذّر الاتصال"); }
    finally { setLoading(false); }
  }

  function copy() {
    navigator.clipboard.writeText(result);
    toast.success("تمّ النسخ");
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Film className="size-7 text-primary" />
          توليد فيديو
        </h1>
        <p className="text-muted-foreground mt-2">
          برومبتات احترافية لفيديوهات AI — استخدمها مع Veo / Runway / Kling
        </p>
      </div>

      <Card className="p-3 mb-4 bg-blue-50 dark:bg-blue-950/30 border-blue-300 flex items-start gap-2 text-sm">
        <Info className="size-4 text-blue-600 shrink-0 mt-0.5" />
        <div>
          توليد الفيديو الفعلي محدود الوصول حالياً (Veo API). دلوقتي Oji يولّد لك **برومبت محترف** تستخدمه في الأدوات الجاهزة.
        </div>
      </Card>

      <Card className="p-5 space-y-4">
        <div>
          <Label htmlFor="scene">وصف المشهد</Label>
          <Textarea
            id="scene"
            value={scene}
            onChange={(e) => setScene(e.target.value)}
            placeholder="مثلاً: كوب قهوة فوق طاولة خشبية، بخار صاعد ببطء، إضاءة دافئة..."
            rows={4}
            className="mt-1"
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label>المدّة</Label>
            <select value={duration} onChange={(e) => setDuration(e.target.value)} className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
              <option value="5s">5 ثوان</option>
              <option value="8s">8 ثوان</option>
              <option value="10s">10 ثوان</option>
              <option value="16s">16 ثانية</option>
            </select>
          </div>
          <div>
            <Label>الأبعاد</Label>
            <select value={aspect} onChange={(e) => setAspect(e.target.value)} className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
              <option value="9:16">9:16 (Story/Reel)</option>
              <option value="16:9">16:9 (Widescreen)</option>
              <option value="1:1">1:1 (Square)</option>
            </select>
          </div>
          <div>
            <Label>النموذج</Label>
            <select value={model} onChange={(e) => setModel(e.target.value)} className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
              {PLATFORMS.map((p) => <option key={p.name}>{p.name}</option>)}
            </select>
          </div>
        </div>

        <Button onClick={generate} disabled={loading} variant="gradient" size="lg" className="w-full">
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          توليد البرومبت
        </Button>
      </Card>

      {result && (
        <Card className="p-5 mt-4">
          <div className="flex justify-between items-center mb-3 pb-3 border-b">
            <h3 className="font-semibold">البرومبت جاهز</h3>
            <Button variant="outline" size="sm" onClick={copy}><Copy className="size-3" /> نسخ</Button>
          </div>
          <pre className="text-sm whitespace-pre-wrap font-mono bg-muted/50 p-4 rounded-md max-h-96 overflow-y-auto" dir="ltr">{result}</pre>

          <div className="mt-4 border-t pt-4">
            <p className="text-sm font-medium mb-2">جرّبه في:</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {PLATFORMS.map((p) => (
                <a
                  key={p.name}
                  href={p.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-2 rounded-md border hover:border-primary text-sm"
                >
                  <span>{p.name}</span>
                  {p.free && <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 px-1.5 rounded">مجاني</span>}
                  <ExternalLink className="size-3" />
                </a>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
