"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Clapperboard, Loader2, Sparkles, Upload, X, Film, Copy, ArrowDown } from "lucide-react";

type Scene = { scene: number; title: string; description: string; visual_prompt: string };

export default function StoryboardPage() {
  const [idea, setIdea] = useState("");
  const [img, setImg] = useState<{ base64: string; type: string; preview: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [scenes, setScenes] = useState<Scene[]>([]);
  // برومبتات التحريك: مفتاح = "pair-i" أو "single-i"
  const [motions, setMotions] = useState<Record<string, string>>({});
  const [motionLoading, setMotionLoading] = useState<string>("");

  function onImg(file: File | null) {
    if (!file || !file.type.startsWith("image/")) return;
    if (file.size > 8 * 1024 * 1024) { toast.error("الصورة أكبر من 8MB"); return; }
    const r = new FileReader();
    r.onload = () => setImg({ base64: (r.result as string).split(",")[1] || "", type: file.type, preview: URL.createObjectURL(file) });
    r.readAsDataURL(file);
  }

  async function generate() {
    if (!idea.trim()) { toast.error("اوصف الفكرة الأول (إجباري)"); return; }
    setLoading(true); setScenes([]); setMotions({});
    try {
      const res = await fetch("/api/generator", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool: "storyboard", input: idea, attachments: img ? [{ type: img.type, base64: img.base64 }] : undefined }),
      });
      if (!res.ok || !res.body) { toast.error("تعذّر التوليد"); return; }
      const reader = res.body.getReader(); const dec = new TextDecoder(); let acc = "";
      while (true) { const { value, done } = await reader.read(); if (done) break; acc += dec.decode(value, { stream: true }); }
      const m = acc.match(/\[[\s\S]*\]/);
      if (!m) { toast.error("مطلعش ستوري بورد صحيح — جرّب تاني"); return; }
      const parsed = JSON.parse(m[0]) as Scene[];
      setScenes(parsed);
      toast.success(`اتعمل ستوري بورد من ${parsed.length} مشاهد 🎬`);
    } catch { toast.error("تعذّر الاتصال أو تحليل النتيجة"); } finally { setLoading(false); }
  }

  async function motion(key: string, input: string) {
    setMotionLoading(key);
    try {
      const res = await fetch("/api/generator", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool: "motion_prompt", input }),
      });
      if (!res.ok || !res.body) { toast.error("تعذّر التوليد"); return; }
      const reader = res.body.getReader(); const dec = new TextDecoder(); let acc = "";
      while (true) { const { value, done } = await reader.read(); if (done) break; acc += dec.decode(value, { stream: true }); }
      setMotions((p) => ({ ...p, [key]: acc.trim() }));
    } catch { toast.error("تعذّر الاتصال"); } finally { setMotionLoading(""); }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="flex items-start gap-4 mb-6">
        <div className="size-12 rounded-xl bg-primary/10 grid place-items-center text-primary shrink-0"><Clapperboard className="size-6" /></div>
        <div>
          <h1 className="text-2xl font-bold">مولّد الستوري بورد + تحريك Veo 3</h1>
          <p className="text-muted-foreground mt-1">اوصف فكرتك (أو ارفع صورة) → ستوري بورد سينمائي مترابط، وبين كل مشهدين زرّ يطلّع برومبت تحريك احترافي لـ Veo 3.</p>
        </div>
      </div>

      <Card className="p-5 space-y-4">
        <div>
          <Label>الفكرة <span className="text-destructive">*</span></Label>
          <Textarea value={idea} onChange={(e) => setIdea(e.target.value)} rows={3} placeholder="مثلاً: إعلان سينمائي لعطر فاخر — لقطة قطرة تسقط، تتحوّل لزجاجة العطر على رخام، وينتهي بلمعة الشعار." className="mt-1" />
        </div>
        <div className="flex items-center gap-3">
          {img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={img.preview} alt="" className="size-14 rounded-lg object-cover border" />
          ) : null}
          <label className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm cursor-pointer hover:border-primary">
            <input type="file" accept="image/*" className="hidden" onChange={(e) => onImg(e.target.files?.[0] || null)} />
            <Upload className="size-4" /> {img ? "تغيير الصورة" : "صورة مرجعية (اختياري)"}
          </label>
          {img && <Button variant="ghost" size="sm" onClick={() => setImg(null)}><X className="size-4" /></Button>}
        </div>
        <Button onClick={generate} disabled={loading} variant="gradient" size="lg" className="w-full">
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          {loading ? "بيصمّم الستوري بورد…" : "توليد الستوري بورد"}
        </Button>
      </Card>

      {scenes.length > 0 && (
        <div className="mt-6 space-y-4">
          {scenes.map((s, i) => (
            <div key={s.scene ?? i}>
              <Card className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-sm">🎬 مشهد {s.scene ?? i + 1}: {s.title}</h3>
                  <span className="text-[10px] text-muted-foreground">{i + 1}/{scenes.length}</span>
                </div>
                <p className="text-sm leading-relaxed">{s.description}</p>
                {s.visual_prompt && (
                  <details className="mt-2 text-xs text-muted-foreground">
                    <summary className="cursor-pointer">برومبت الصورة (English)</summary>
                    <div className="mt-1 flex items-start gap-2">
                      <pre className="flex-1 bg-muted/50 rounded p-2 whitespace-pre-wrap" dir="ltr">{s.visual_prompt}</pre>
                      <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(s.visual_prompt); toast.success("اتنسخ"); }}><Copy className="size-3" /></Button>
                    </div>
                  </details>
                )}
                {/* تحريك مشهد واحد */}
                <div className="mt-3">
                  <Button variant="outline" size="sm" onClick={() => motion(`single-${i}`, `مشهد واحد للتحريك:\n${s.description}\nالفكرة العامة: ${idea}\n(تحريك لصورة/مشهد واحد)`)} disabled={motionLoading === `single-${i}`}>
                    {motionLoading === `single-${i}` ? <Loader2 className="size-3.5 animate-spin" /> : <Film className="size-3.5" />} برومبت تحريك للمشهد ده
                  </Button>
                  {motions[`single-${i}`] && <MotionBox text={motions[`single-${i}`]} />}
                </div>
              </Card>

              {/* زرّ التحريك بين المشهدين */}
              {i < scenes.length - 1 && (
                <div className="flex flex-col items-center py-2">
                  <ArrowDown className="size-4 text-muted-foreground" />
                  <Button variant="outline" size="sm" className="my-1" onClick={() => motion(`pair-${i}`, `الانتقال بين مشهدين:\nمن (المشهد ${i + 1}): ${s.description}\nإلى (المشهد ${i + 2}): ${scenes[i + 1].description}\nالفكرة العامة: ${idea}`)} disabled={motionLoading === `pair-${i}`}>
                    {motionLoading === `pair-${i}` ? <Loader2 className="size-3.5 animate-spin" /> : <Film className="size-3.5" />} 🎬 برومبت تحريك (الانتقال للمشهد الجاي)
                  </Button>
                  {motions[`pair-${i}`] && <MotionBox text={motions[`pair-${i}`]} />}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MotionBox({ text }: { text: string }) {
  return (
    <div className="mt-2 w-full">
      <div className="flex items-start gap-2">
        <pre className="flex-1 text-xs bg-primary/5 border border-primary/20 rounded-lg p-2.5 whitespace-pre-wrap leading-relaxed" dir="ltr">{text}</pre>
        <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(text); toast.success("اتنسخ برومبت التحريك"); }}><Copy className="size-3" /></Button>
      </div>
    </div>
  );
}
