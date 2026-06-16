"use client";

import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Film, Loader2, Download, Sparkles, X, Paperclip, Clock, CheckCircle2, FolderOpen,
} from "lucide-react";
import Link from "next/link";
import { saveVideoToLibrary } from "@/lib/media-library";

type Phase = "idle" | "starting" | "generating" | "done" | "error";

function handle401(res: Response): boolean {
  if (res.status === 401) {
    toast.error("انتهت جلستك — جاري تحويلك لتسجيل الدخول");
    setTimeout(() => { window.location.href = "/login?redirect=" + encodeURIComponent(window.location.pathname); }, 1200);
    return true;
  }
  return false;
}

export default function VideoGeneratePage() {
  const [prompt, setPrompt] = useState("");
  const [aspect, setAspect] = useState<"16:9" | "9:16">("16:9");
  const [model, setModel] = useState<"fast" | "quality">("fast");
  const [refImage, setRefImage] = useState<{ data: string; mimeType: string; previewUrl: string } | null>(null);

  const [phase, setPhase] = useState<Phase>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [videoUrl, setVideoUrl] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  function handleFile(file: File | null) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("الصورة أكبر من 5MB"); return; }
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      const r = reader.result as string;
      setRefImage({
        data: r.split(",")[1] || "",
        mimeType: file.type,
        previewUrl: URL.createObjectURL(file),
      });
    };
    reader.readAsDataURL(file);
  }

  async function generate() {
    if (!prompt.trim()) { toast.error("اكتب وصف الفيديو"); return; }

    setPhase("starting");
    setVideoUrl("");
    setErrorMsg("");
    setElapsed(0);

    try {
      const res = await fetch("/api/video-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          aspect,
          model,
          refImage: refImage ? { mimeType: refImage.mimeType, data: refImage.data } : undefined,
        }),
      });
      if (handle401(res)) { setPhase("idle"); return; }
      const data = await res.json();
      if (!res.ok) {
        setPhase("error");
        setErrorMsg(data.error || "تعذّر بدء التوليد");
        toast.error(data.error || "تعذّر بدء التوليد");
        return;
      }

      const opName = data.operationName;
      setPhase("generating");
      toast.success("بدأ التوليد — عادةً ياخد من دقيقة لـ 3 دقايق");

      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);

      pollRef.current = setInterval(async () => {
        try {
          const pollRes = await fetch(`/api/video-generate?op=${encodeURIComponent(opName)}`);
          const pollData = await pollRes.json();

          if (pollData.error && pollData.done !== false) {
            stopTimers();
            setPhase("error");
            setErrorMsg(pollData.error);
            toast.error(pollData.error);
            return;
          }

          if (pollData.done && pollData.videoUri) {
            stopTimers();
            const proxyUrl = `/api/video-generate?download=${encodeURIComponent(pollData.videoUri)}`;
            setVideoUrl(proxyUrl);
            setPhase("done");
            toast.success("🎬 الفيديو جاهز!");
            // 💾 حفظ تلقائي في ملفاتي — مش هيضيع بعد الريفرش
            void fetch(proxyUrl)
              .then((r) => (r.ok ? r.blob() : null))
              .then((blob) => {
                if (blob && blob.size > 1000) {
                  return saveVideoToLibrary(blob);
                }
                return null;
              })
              .then((ok) => {
                if (ok) toast.success("اتحفظ في 📁 ملفاتي تلقائياً", { id: "autosave-vid" });
              })
              .catch(() => {});
          }
        } catch {
          // تجاهل أخطاء polling مؤقتة
        }
      }, 10_000);
    } catch {
      setPhase("error");
      setErrorMsg("تعذّر الاتصال");
      toast.error("تعذّر الاتصال");
    }
  }

  function stopTimers() {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }

  function formatTime(s: number) {
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  }

  const busy = phase === "starting" || phase === "generating";

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Film className="size-7 text-primary" />
          توليد فيديو — Veo 3
        </h1>
        <p className="text-muted-foreground mt-2">
          فيديو 8 ثوانٍ حقيقي بالصوت من وصفك — بأحدث نموذج من Google
        </p>
      </div>

      <Card className="p-5 space-y-4">
        <div>
          <Label htmlFor="prompt">وصف الفيديو</Label>
          <Textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="مثلاً: لقطة سينمائية لكوب قهوة يتصاعد منه البخار على طاولة خشبية، إضاءة صباحية دافئة، حركة كاميرا بطيئة للأمام..."
            rows={4}
            className="mt-1"
            disabled={busy}
          />
          <p className="text-xs text-muted-foreground mt-1">
            💡 اكتب بالعربي أو الإنجليزي — اذكر الحركة، الإضاءة، وزاوية الكاميرا لنتيجة أفضل
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>الأبعاد</Label>
            <div className="mt-1 flex gap-2">
              <button
                onClick={() => setAspect("16:9")}
                disabled={busy}
                className={`flex-1 p-2 rounded-md text-xs border transition-all ${aspect === "16:9" ? "bg-primary text-primary-foreground border-primary" : "hover:border-primary/40"}`}
              >
                🖥️ أفقي 16:9
              </button>
              <button
                onClick={() => setAspect("9:16")}
                disabled={busy}
                className={`flex-1 p-2 rounded-md text-xs border transition-all ${aspect === "9:16" ? "bg-primary text-primary-foreground border-primary" : "hover:border-primary/40"}`}
              >
                📱 عمودي 9:16
              </button>
            </div>
          </div>
          <div>
            <Label>الجودة</Label>
            <div className="mt-1 flex gap-2">
              <button
                onClick={() => setModel("fast")}
                disabled={busy}
                className={`flex-1 p-2 rounded-md text-xs border transition-all ${model === "fast" ? "bg-primary text-primary-foreground border-primary" : "hover:border-primary/40"}`}
              >
                ⚡ سريع (أرخص)
              </button>
              <button
                onClick={() => setModel("quality")}
                disabled={busy}
                className={`flex-1 p-2 rounded-md text-xs border transition-all ${model === "quality" ? "bg-primary text-primary-foreground border-primary" : "hover:border-primary/40"}`}
              >
                💎 أعلى جودة
              </button>
            </div>
          </div>
        </div>

        <div>
          <Label>صورة بداية (اختياري — Image to Video)</Label>
          {refImage ? (
            <div className="relative inline-block mt-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={refImage.previewUrl} alt="ref" className="max-h-40 rounded-lg border" />
              <button
                onClick={() => setRefImage(null)}
                disabled={busy}
                className="absolute top-1 right-1 size-6 rounded-full bg-destructive text-white grid place-items-center"
              >
                <X className="size-3" />
              </button>
            </div>
          ) : (
            <label className={`mt-1 block border-2 border-dashed rounded-lg p-6 text-center ${busy ? "opacity-50" : "cursor-pointer hover:border-primary"}`}>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={busy}
                onChange={(e) => handleFile(e.target.files?.[0] || null)}
              />
              <Paperclip className="size-6 mx-auto text-muted-foreground mb-1" />
              <p className="text-xs text-muted-foreground">ارفع صورة ليتحرّك منها الفيديو</p>
            </label>
          )}
        </div>

        <Button onClick={generate} disabled={busy} variant="gradient" size="lg" className="w-full">
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          {phase === "starting" ? "جاري البدء..." : phase === "generating" ? `جاري التوليد... ${formatTime(elapsed)}` : "توليد الفيديو"}
        </Button>

        {phase === "generating" && (
          <Card className="p-4 bg-primary/5 border-primary/30 flex items-center gap-3">
            <Clock className="size-5 text-primary shrink-0 animate-pulse" />
            <div className="text-sm">
              <p className="font-medium">Veo 3 يصنع فيديوك الآن...</p>
              <p className="text-xs text-muted-foreground">عادةً من دقيقة إلى 3 دقايق — اترك الصفحة مفتوحة</p>
            </div>
          </Card>
        )}

        {phase === "error" && errorMsg && (
          <Card className="p-4 bg-destructive/5 border-destructive/30 text-sm text-destructive">
            {errorMsg}
          </Card>
        )}

        {phase === "done" && videoUrl && (
          <Card className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="size-5" /> فيديوك جاهز!
            </div>
            <video src={videoUrl} controls autoPlay loop className="w-full rounded-lg" />
            <div className="flex justify-between items-center">
              <Link href="/studio/library" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
                <FolderOpen className="size-4" /> اتحفظ في ملفاتي
              </Link>
              <a
                href={videoUrl}
                download={`oji-video-${Date.now()}.mp4`}
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
              >
                <Download className="size-4" /> تنزيل MP4
              </a>
            </div>
          </Card>
        )}
      </Card>
    </div>
  );
}
