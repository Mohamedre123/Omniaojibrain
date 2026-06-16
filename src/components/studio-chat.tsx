"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { saveImageToLibrary, saveVideoToLibrary } from "@/lib/media-library";
import {
  ImageIcon as ImageLucide, // alias to avoid clash
  Film,
  Loader2,
  Download,
  Paperclip,
  X,
  Send,
  RotateCcw,
  FolderOpen,
  Wand2,
} from "lucide-react";
import Link from "next/link";

type Mode = "image" | "video";

type ChatMsg = {
  id: string;
  role: "user" | "assistant";
  text?: string;
  kind?: Mode;
  image?: { data: string; mimeType: string }; // base64 (للصور)
  videoUrl?: string; // proxy url (للفيديو)
  status?: "loading" | "error" | "done";
  error?: string;
  refPreview?: string; // معاينة صورة مرفقة من المستخدم
};

type RefImg = { data: string; mimeType: string; previewUrl: string; name: string };

const IMAGE_ASPECTS = [
  { label: "مربّع 1:1", value: "1:1" },
  { label: "بورتريه 4:5", value: "4:5" },
  { label: "ستوري 9:16", value: "9:16" },
  { label: "أفقي 16:9", value: "16:9" },
  { label: "2:3", value: "2:3" },
];

const VIDEO_ASPECTS = [
  { label: "أفقي 16:9", value: "16:9" },
  { label: "عمودي 9:16", value: "9:16" },
];

let _id = 0;
function uid() {
  _id += 1;
  return `m${Date.now()}_${_id}`;
}

function handle401(res: Response): boolean {
  if (res.status === 401) {
    toast.error("انتهت جلستك — جاري تحويلك لتسجيل الدخول");
    setTimeout(() => {
      window.location.href = "/login?redirect=" + encodeURIComponent(window.location.pathname);
    }, 1200);
    return true;
  }
  return false;
}

export function StudioChat() {
  const [mode, setMode] = useState<Mode>("image");
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [imgAspect, setImgAspect] = useState("1:1");
  const [vidAspect, setVidAspect] = useState<"16:9" | "9:16">("16:9");
  const [vidQuality, setVidQuality] = useState<"fast" | "quality">("fast");
  const [useBrand, setUseBrand] = useState(true);
  const [busy, setBusy] = useState(false);
  const [ref, setRef] = useState<RefImg | null>(null);
  const [elapsed, setElapsed] = useState(0);

  // سياق التعديل: آخر صورة وُلِّدت (عشان "عدّل عليها" بدون إعادة رفع)
  const lastImageRef = useRef<{ data: string; mimeType: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, elapsed, scrollToBottom]);

  useEffect(() => () => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  function update(id: string, patch: Partial<ChatMsg>) {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  }

  function handleFile(file: File | null) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("الصورة أكبر من 5MB"); return; }
    if (!file.type.startsWith("image/")) { toast.error("الملف لازم يكون صورة"); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const r = reader.result as string;
      setRef({ data: r.split(",")[1] || "", mimeType: file.type, previewUrl: URL.createObjectURL(file), name: file.name });
    };
    reader.readAsDataURL(file);
  }

  async function getBrandContext(): Promise<string> {
    if (!useBrand) return "";
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return "";
      const { data: profile } = await supabase
        .from("profiles")
        .select("brand_voice, brand_name, brand_colors")
        .eq("id", user.id)
        .maybeSingle();
      if (!profile) return "";
      const colors = (profile.brand_colors as string[]) || [];
      return [
        profile.brand_name && `Brand: ${profile.brand_name}`,
        profile.brand_voice && `Voice: ${profile.brand_voice}`,
        colors.length > 0 && `Brand colors (use exactly): ${colors.join(", ")}`,
      ].filter(Boolean).join(". ");
    } catch {
      return "";
    }
  }

  function stopTimers() {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }

  async function send() {
    const text = input.trim();
    if (!text && !ref) return;
    if (busy) return;

    const userMsg: ChatMsg = {
      id: uid(),
      role: "user",
      text: text || (mode === "image" ? "ولّد صورة من المرفق" : "ولّد فيديو من المرفق"),
      refPreview: ref?.previewUrl,
      kind: mode,
    };
    const assistantId = uid();
    const assistantMsg: ChatMsg = { id: assistantId, role: "assistant", kind: mode, status: "loading" };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput("");
    const attachedRef = ref;
    setRef(null);
    setBusy(true);

    if (mode === "image") {
      await runImage(text, assistantId, attachedRef);
    } else {
      await runVideo(text, assistantId, attachedRef);
    }
  }

  async function runImage(text: string, assistantId: string, attachedRef: RefImg | null) {
    try {
      const brandContext = await getBrandContext();

      // سياق التعديل: لو المستخدم رفع صورة استخدمها، وإلا لو فيه آخر صورة مولّدة استخدمها كأساس للتعديل
      const refs: Array<{ mimeType: string; data: string }> = [];
      let editing = false;
      if (attachedRef) {
        refs.push({ mimeType: attachedRef.mimeType, data: attachedRef.data });
      } else if (lastImageRef.current) {
        refs.push({ mimeType: lastImageRef.current.mimeType, data: lastImageRef.current.data });
        editing = true;
      }

      const editNote = editing
        ? " IMPORTANT: An existing generated image is attached. Apply the user's requested change to THAT image while keeping everything else identical (same subject, composition, identity). Only change what the user asked."
        : attachedRef
        ? " IMPORTANT: A reference image is attached — keep the product/subject identity (logo, packaging, shape) 100% identical; only build the requested scene around it."
        : "";

      const fullPrompt = `${text}.${editNote} Aspect ratio: ${imgAspect}.`;

      const res = await fetch("/api/image-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: fullPrompt,
          brandContext: brandContext || undefined,
          aspect: imgAspect,
          refImages: refs.length > 0 ? refs : undefined,
        }),
      });
      if (handle401(res)) { setBusy(false); return; }
      const data = await res.json();
      if (!res.ok || !data.images?.length) {
        update(assistantId, { status: "error", error: data.error || "تعذّر التوليد" });
        toast.error(data.error || "تعذّر التوليد");
        setBusy(false);
        return;
      }

      const img = data.images[0] as { data: string; mimeType: string };
      lastImageRef.current = img;
      update(assistantId, {
        status: "done",
        image: img,
        text: editing ? "عدّلت الصورة ✨ — تقدر تكمّل تعديل تاني، أو تبدأ صورة جديدة." : "اتفضّل الصورة 🎨 — قولّي لو عايز أعدّل أي حاجة فيها.",
      });

      void saveImageToLibrary(img.data, img.mimeType).then((ok) => {
        if (ok) toast.success("اتحفظت في 📁 ملفاتي", { id: "autosave" });
      });
    } catch {
      update(assistantId, { status: "error", error: "تعذّر الاتصال" });
      toast.error("تعذّر الاتصال");
    } finally {
      setBusy(false);
    }
  }

  async function runVideo(text: string, assistantId: string, attachedRef: RefImg | null) {
    setElapsed(0);
    try {
      const startImg = attachedRef ?? (lastImageRef.current
        ? { ...lastImageRef.current, previewUrl: "", name: "last" }
        : null);

      const res = await fetch("/api/video-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: text,
          aspect: vidAspect,
          model: vidQuality,
          refImage: startImg ? { mimeType: startImg.mimeType, data: startImg.data } : undefined,
        }),
      });
      if (handle401(res)) { setBusy(false); return; }
      const data = await res.json();
      if (!res.ok || !data.operationName) {
        update(assistantId, { status: "error", error: data.error || "تعذّر بدء التوليد" });
        toast.error(data.error || "تعذّر بدء التوليد");
        setBusy(false);
        return;
      }

      update(assistantId, { text: "بصنع الفيديو دلوقتي 🎬 — عادةً من دقيقة لـ 3 دقايق، سيبك في الصفحة." });
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);

      const opName = data.operationName as string;
      pollRef.current = setInterval(async () => {
        try {
          const pollRes = await fetch(`/api/video-generate?op=${encodeURIComponent(opName)}`);
          const pollData = await pollRes.json();

          if (pollData.error && pollData.done !== false) {
            stopTimers();
            update(assistantId, { status: "error", error: pollData.error });
            toast.error(pollData.error);
            setBusy(false);
            return;
          }
          if (pollData.done && pollData.videoUri) {
            stopTimers();
            const proxyUrl = `/api/video-generate?download=${encodeURIComponent(pollData.videoUri)}`;
            // حمّل الفيديو مرّة واحدة كـ blob — يظهر فوراً (بدل تنزيلين متنافسين عبر الـ proxy)
            update(assistantId, { text: "خلص التوليد — بحضّر المعاينة… ⏳" });
            try {
              const r = await fetch(proxyUrl);
              const blob = r.ok ? await r.blob() : null;
              if (blob && blob.size > 1000) {
                const objUrl = URL.createObjectURL(blob);
                update(assistantId, { status: "done", videoUrl: objUrl, text: "🎬 الفيديو جاهز! اتحفظ في ملفاتي تلقائياً." });
                void saveVideoToLibrary(blob).then((ok) => {
                  if (ok) toast.success("اتحفظ في 📁 ملفاتي", { id: "autosave-vid" });
                });
              } else {
                update(assistantId, { status: "done", videoUrl: proxyUrl, text: "🎬 الفيديو جاهز!" });
              }
            } catch {
              update(assistantId, { status: "done", videoUrl: proxyUrl, text: "🎬 الفيديو جاهز!" });
            }
            setBusy(false);
          }
        } catch {
          // تجاهل أخطاء polling المؤقتة
        }
      }, 5_000);
    } catch {
      update(assistantId, { status: "error", error: "تعذّر الاتصال" });
      toast.error("تعذّر الاتصال");
      setBusy(false);
    }
  }

  function newSession() {
    if (busy) return;
    lastImageRef.current = null;
    setMessages([]);
    setRef(null);
    toast.success("بدأنا من جديد ✨");
  }

  function downloadImage(img: { data: string; mimeType: string }) {
    const ext = img.mimeType.includes("png") ? "png" : img.mimeType.includes("webp") ? "webp" : "jpg";
    const a = document.createElement("a");
    a.href = `data:${img.mimeType};base64,${img.data}`;
    a.download = `oji-${Date.now()}.${ext}`;
    a.click();
  }

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const aspects = mode === "image" ? IMAGE_ASPECTS : VIDEO_ASPECTS;
  const currentAspect = mode === "image" ? imgAspect : vidAspect;

  return (
    <div className="flex flex-col h-[calc(100dvh-4rem)]">
      {/* شريط علوي: تبديل الموديل + إعدادات */}
      <div className="border-b bg-card/60 backdrop-blur px-3 sm:px-4 py-2.5 space-y-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          {/* مبدّل الموديل */}
          <div className="inline-flex rounded-lg border bg-background p-0.5">
            <button
              onClick={() => setMode("image")}
              disabled={busy}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                mode === "image" ? "gradient-brand text-white shadow" : "text-muted-foreground"
              }`}
            >
              <ImageLucide className="size-4" /> صور
            </button>
            <button
              onClick={() => setMode("video")}
              disabled={busy}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                mode === "video" ? "gradient-brand text-white shadow" : "text-muted-foreground"
              }`}
            >
              <Film className="size-4" /> فيديو
            </button>
          </div>

          <div className="flex-1" />

          <Link href="/studio/library" className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground hover:text-primary">
            <FolderOpen className="size-4" /> ملفاتي
          </Link>
          <Button variant="ghost" size="sm" onClick={newSession} disabled={busy} className="text-xs">
            <RotateCcw className="size-3.5" /> جديد
          </Button>
        </div>

        {/* الأبعاد + خيارات */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {aspects.map((a) => (
            <button
              key={a.value}
              onClick={() => (mode === "image" ? setImgAspect(a.value) : setVidAspect(a.value as "16:9" | "9:16"))}
              disabled={busy}
              className={`px-2.5 py-1 rounded-md text-xs border transition-all ${
                currentAspect === a.value ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:border-primary/50"
              }`}
            >
              {a.label}
            </button>
          ))}
          {mode === "video" && (
            <div className="inline-flex rounded-md border overflow-hidden text-xs">
              <button
                onClick={() => setVidQuality("fast")}
                disabled={busy}
                className={`px-2.5 py-1 ${vidQuality === "fast" ? "bg-primary text-primary-foreground" : "bg-card"}`}
              >سريع</button>
              <button
                onClick={() => setVidQuality("quality")}
                disabled={busy}
                className={`px-2.5 py-1 ${vidQuality === "quality" ? "bg-primary text-primary-foreground" : "bg-card"}`}
              >جودة عالية</button>
            </div>
          )}
          <label className="inline-flex items-center gap-1.5 text-xs cursor-pointer mr-auto">
            <input type="checkbox" checked={useBrand} onChange={(e) => setUseBrand(e.target.checked)} className="size-3.5" />
            هويتي
          </label>
        </div>
      </div>

      {/* منطقة الرسائل */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto overscroll-contain px-3 sm:px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="h-full grid place-items-center text-center px-4">
            <div className="max-w-md">
              <div className="mx-auto size-16 rounded-2xl gradient-brand grid place-items-center mb-4 animate-float-slow">
                {mode === "image" ? <Wand2 className="size-8 text-white" /> : <Film className="size-8 text-white" />}
              </div>
              <h2 className="text-xl font-bold">
                {mode === "image" ? "استوديو الصور — كلّمني وأنا أصمّم" : "استوديو الفيديو — احكيلي الفكرة"}
              </h2>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                {mode === "image"
                  ? "اكتب اللي في دماغك (مثلاً: كوب قهوة على طاولة رخام بإضاءة دافئة). بعد ما أطلّعها، قولّي «خليها أزرق» أو «زوّد البخار» وأنا أعدّل على نفس الصورة."
                  : "اوصف الفيديو اللي عايزه (مثلاً: لقطة سينمائية لعصير برتقال بيتسكب). تقدر ترفق صورة بداية. ياخد من دقيقة لـ 3 دقايق."}
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {(mode === "image"
                  ? ["منتج عناية بالبشرة على خلفية رخام فاخرة", "إعلان برجر شهي بإضاءة سينمائية", "بوست خصم 50% بألوان جذابة"]
                  : ["لقطة بطيئة لقطرات ماء على تفاحة حمراء", "كاميرا تدور حول ساعة فاخرة", "مشهد افتتاح متجر بإضاءة نيون"]
                ).map((s) => (
                  <button
                    key={s}
                    onClick={() => setInput(s)}
                    className="rounded-full border bg-card px-3 py-1.5 text-xs hover:border-primary hover:bg-accent/50 transition-all"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === "user" ? "justify-start" : "justify-end"}`}>
            <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl ${
              m.role === "user" ? "bg-primary/10 px-4 py-2.5" : "bg-card border p-2.5"
            }`}>
              {m.refPreview && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.refPreview} alt="مرفق" className="mb-2 max-h-40 rounded-lg object-cover" />
              )}
              {m.text && (
                <p className={`text-sm leading-relaxed whitespace-pre-wrap break-words ${m.role === "assistant" && (m.image || m.videoUrl) ? "px-1.5 pt-1" : ""}`}>
                  {m.text}
                </p>
              )}

              {m.status === "loading" && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground px-1.5 py-1.5">
                  <Loader2 className="size-4 animate-spin" />
                  {m.kind === "video"
                    ? <span>بصنع الفيديو… {elapsed > 0 ? fmt(elapsed) : ""}</span>
                    : <span>بصمّم الصورة…</span>}
                </div>
              )}

              {m.status === "error" && (
                <p className="text-sm text-destructive px-1.5 py-1">⚠️ {m.error}</p>
              )}

              {m.image && (
                <div className="mt-1.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`data:${m.image.mimeType};base64,${m.image.data}`}
                    alt="الصورة المولّدة"
                    className="rounded-xl w-full max-w-md"
                  />
                  <div className="mt-2 px-1">
                    <Button variant="outline" size="sm" onClick={() => m.image && downloadImage(m.image)} className="text-xs">
                      <Download className="size-3.5" /> تحميل
                    </Button>
                  </div>
                </div>
              )}

              {m.videoUrl && (
                <div className="mt-1.5">
                  <video src={m.videoUrl} controls autoPlay loop playsInline className="rounded-xl w-full max-w-md" />
                  <div className="mt-2 px-1">
                    <a href={m.videoUrl} download={`oji-${Date.now()}.mp4`}>
                      <Button variant="outline" size="sm" className="text-xs">
                        <Download className="size-3.5" /> تحميل
                      </Button>
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* شريط الإدخال */}
      <div className="border-t bg-card/60 backdrop-blur px-3 sm:px-4 py-3 safe-bottom">
        {ref && (
          <div className="mb-2 inline-flex items-center gap-2 rounded-lg border bg-background p-1.5 pr-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ref.previewUrl} alt={ref.name} className="size-10 rounded object-cover" />
            <span className="text-xs text-muted-foreground max-w-[120px] truncate">{ref.name}</span>
            <button onClick={() => setRef(null)} className="size-5 rounded-full hover:bg-muted grid place-items-center">
              <X className="size-3.5" />
            </button>
          </div>
        )}
        <div className="flex items-end gap-2">
          <label className={`shrink-0 size-11 rounded-xl border grid place-items-center cursor-pointer hover:border-primary transition-colors ${busy ? "opacity-50 pointer-events-none" : ""}`}>
            <input type="file" accept="image/*" className="hidden" disabled={busy} onChange={(e) => handleFile(e.target.files?.[0] || null)} />
            <Paperclip className="size-5 text-muted-foreground" />
          </label>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); }
            }}
            placeholder={mode === "image" ? "اكتب وصف الصورة أو طلب تعديل…" : "اكتب وصف الفيديو…"}
            rows={1}
            dir="auto"
            disabled={busy}
            className="resize-none min-h-11 max-h-32 py-2.5"
          />
          <Button
            variant="gradient"
            size="icon"
            onClick={() => void send()}
            disabled={busy || (!input.trim() && !ref)}
            className="shrink-0 size-11 rounded-xl"
            title="إرسال"
          >
            {busy ? <Loader2 className="size-5 animate-spin" /> : <Send className="size-5" />}
          </Button>
        </div>
        <p className="mt-1.5 text-[11px] text-muted-foreground text-center">
          {mode === "image"
            ? "💡 بعد توليد الصورة، اكتب تعديلك (زي «خليها ليلاً») وأنا أعدّل على نفس الصورة — أو اضغط «جديد» لبداية جديدة."
            : "🎬 ممكن ترفق صورة بداية. الفيديو بيتولّد بالـ API ويتحفظ في ملفاتي تلقائياً."}
        </p>
      </div>
    </div>
  );
}
