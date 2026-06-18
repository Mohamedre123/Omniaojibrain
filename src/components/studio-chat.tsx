"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { saveImageToLibrary, saveVideoToLibrary, downloadAsBase64 } from "@/lib/media-library";
import {
  ensureStudioConversations,
  loadStudioMessages,
  addStudioMessage,
  clearStudioConversation,
  type CloudMsg,
} from "@/lib/studio-cloud";
import {
  ImageIcon as ImageLucide,
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
  imageSrc?: string; // data: URI (مولّدة) أو signed URL (محمّلة)
  imageData?: string; // base64 للصور المولّدة حديثاً
  mimeType?: string;
  videoSrc?: string; // object URL أو signed URL
  mediaPath?: string; // مسار التخزين
  status?: "loading" | "error" | "done";
  error?: string;
  refPreview?: string;
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

function cloudToChat(m: CloudMsg): ChatMsg {
  return {
    id: m.id,
    role: m.role,
    text: m.text,
    kind: m.kind,
    imageSrc: m.imageSrc,
    videoSrc: m.videoSrc,
    mediaPath: m.mediaPath,
    mimeType: m.mimeType,
    status: "done",
  };
}

export function StudioChat() {
  const [mode, setMode] = useState<Mode>("image");
  const [threads, setThreads] = useState<Record<Mode, ChatMsg[]>>({ image: [], video: [] });
  const [input, setInput] = useState("");
  const [imgAspect, setImgAspect] = useState("1:1");
  const [imgQuality, setImgQuality] = useState<"fast" | "high">("fast");
  const [vidAspect, setVidAspect] = useState<"16:9" | "9:16">("16:9");
  const [vidQuality, setVidQuality] = useState<"fast" | "quality">("fast");
  const [useBrand, setUseBrand] = useState(true);
  const [busy, setBusy] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [ref, setRef] = useState<RefImg | null>(null);
  const [elapsed, setElapsed] = useState(0);

  const messages = threads[mode];

  const lastImageRef = useRef<{ data?: string; mimeType: string; path?: string } | null>(null);
  const brandLogoCache = useRef<{ url: string; logo: { data: string; mimeType: string } | null } | null>(null);
  const convoIds = useRef<{ image: string; video: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, elapsed, mode, scrollToBottom]);

  useEffect(() => () => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  // ☁️ حمّل المحادثات من السحابة (تتزامن على كل الأجهزة)
  useEffect(() => {
    (async () => {
      const ids = await ensureStudioConversations();
      convoIds.current = ids;
      if (ids) {
        const [img, vid] = await Promise.all([
          loadStudioMessages(ids.image, "image"),
          loadStudioMessages(ids.video, "video"),
        ]);
        setThreads({ image: img.map(cloudToChat), video: vid.map(cloudToChat) });
        const lastImg = [...img].reverse().find((m) => m.mediaPath && m.imageSrc);
        if (lastImg?.mediaPath) lastImageRef.current = { mimeType: lastImg.mimeType || "image/png", path: lastImg.mediaPath };
      }
      setLoadingHistory(false);
    })();
  }, []);

  const updateMsg = useCallback((m: Mode, id: string, patch: Partial<ChatMsg>) => {
    setThreads((prev) => ({
      ...prev,
      [m]: prev[m].map((msg) => (msg.id === id ? { ...msg, ...patch } : msg)),
    }));
  }, []);

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

  // يصغّر الصورة المرجعية قبل الإرسال (يقلّل حجم الطلب → يمنع فشل الاتصال ويسرّع)
  async function shrinkImage(dataB64: string, mime: string, max = 1280, quality = 0.85): Promise<{ data: string; mimeType: string }> {
    return new Promise((resolve) => {
      try {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          if (Math.max(width, height) > max) {
            const scale = max / Math.max(width, height);
            width = Math.round(width * scale);
            height = Math.round(height * scale);
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) { resolve({ data: dataB64, mimeType: mime }); return; }
          ctx.drawImage(img, 0, 0, width, height);
          const out = canvas.toDataURL("image/jpeg", quality);
          resolve({ data: out.split(",")[1] || dataB64, mimeType: "image/jpeg" });
        };
        img.onerror = () => resolve({ data: dataB64, mimeType: mime });
        img.src = `data:${mime};base64,${dataB64}`;
      } catch {
        resolve({ data: dataB64, mimeType: mime });
      }
    });
  }

  async function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(((reader.result as string) || "").split(",")[1] || "");
      reader.onerror = () => resolve("");
      reader.readAsDataURL(blob);
    });
  }

  async function getBrandIdentity(): Promise<{ text: string; logo: { data: string; mimeType: string } | null }> {
    if (!useBrand) return { text: "", logo: null };
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { text: "", logo: null };
      const { data: profile } = await supabase
        .from("profiles")
        .select("brand_voice, brand_name, brand_colors, brand_logo_url")
        .eq("id", user.id)
        .maybeSingle();
      if (!profile) return { text: "", logo: null };
      const colors = (profile.brand_colors as string[]) || [];
      const text = [
        profile.brand_name && `Brand: ${profile.brand_name}`,
        profile.brand_voice && `Voice: ${profile.brand_voice}`,
        colors.length > 0 && `Brand colors (use exactly): ${colors.join(", ")}`,
      ].filter(Boolean).join(". ");

      // الشعار كمرجع ألوان (مع كاش)
      let logo: { data: string; mimeType: string } | null = null;
      const url = profile.brand_logo_url as string | null;
      if (url) {
        if (brandLogoCache.current?.url === url) {
          logo = brandLogoCache.current.logo;
        } else {
          try {
            const r = await fetch(url);
            if (r.ok) {
              const blob = await r.blob();
              if (blob.type.startsWith("image/") && blob.size < 4 * 1024 * 1024) {
                const data = await blobToBase64(blob);
                if (data) logo = { data, mimeType: blob.type };
              }
            }
          } catch {
            // تجاهل
          }
          brandLogoCache.current = { url, logo };
        }
      }
      return { text, logo };
    } catch {
      return { text: "", logo: null };
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

    const activeMode = mode;
    const userText = text || (activeMode === "image" ? "ولّد صورة من المرفق" : "ولّد فيديو من المرفق");
    const userMsg: ChatMsg = { id: uid(), role: "user", text: userText, refPreview: ref?.previewUrl, kind: activeMode };
    const assistantId = uid();
    const assistantMsg: ChatMsg = { id: assistantId, role: "assistant", kind: activeMode, status: "loading" };

    setThreads((prev) => ({ ...prev, [activeMode]: [...prev[activeMode], userMsg, assistantMsg] }));
    setInput("");
    const attachedRef = ref;
    setRef(null);
    setBusy(true);

    if (activeMode === "image") {
      await runImage(text, userText, assistantId, attachedRef);
    } else {
      await runVideo(text, userText, assistantId, attachedRef);
    }
  }

  async function runImage(text: string, userText: string, assistantId: string, attachedRef: RefImg | null) {
    try {
      const brand = await getBrandIdentity();
      const brandContext = brand.text;

      // حل الصورة المرجعية للتعديل: المرفق، أو آخر صورة (ننزّلها base64 لو لازم)
      let refData: { mimeType: string; data: string } | null = null;
      let editing = false;
      if (attachedRef) {
        refData = { mimeType: attachedRef.mimeType, data: attachedRef.data };
      } else if (lastImageRef.current) {
        if (lastImageRef.current.data) {
          refData = { mimeType: lastImageRef.current.mimeType, data: lastImageRef.current.data };
          editing = true;
        } else if (lastImageRef.current.path) {
          const dl = await downloadAsBase64(lastImageRef.current.path);
          if (dl) {
            refData = dl;
            lastImageRef.current.data = dl.data;
            editing = true;
          }
        }
      }

      const editNote = editing
        ? " IMPORTANT: An existing generated image is attached. Apply the user's requested change to THAT image while keeping everything else identical (same subject, composition, identity). Only change what the user asked."
        : attachedRef
        ? " IMPORTANT: A reference image is attached — keep the product/subject identity (logo, packaging, shape) 100% identical; only build the requested scene around it."
        : "";

      // الصور المرجعية (مصغّرة): (المرجع/آخر صورة) + الشعار كمرجع ألوان للتوليد الجديد فقط
      const refImages: Array<{ mimeType: string; data: string }> = [];
      if (refData) refImages.push(await shrinkImage(refData.data, refData.mimeType));
      let logoNote = "";
      if (brand.logo && !attachedRef && !editing && refImages.length < 3) {
        refImages.push(await shrinkImage(brand.logo.data, brand.logo.mimeType, 512));
        logoNote = " A brand LOGO image is also attached ONLY as a color & style reference — match the brand's exact color palette and visual identity from it. Do NOT draw or include the logo itself in the output unless explicitly requested.";
      }

      const fullPrompt = `${text}.${editNote}${logoNote} Aspect ratio: ${imgAspect}.`;

      // مهلة من جهة العميل عشان ما يفضلش معلّق على شبكات الموبايل
      const controller = new AbortController();
      const clientTimeout = setTimeout(() => controller.abort(), imgQuality === "fast" ? 110_000 : 280_000);
      let res: Response;
      try {
        res = await fetch("/api/image-generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: fullPrompt,
            brandContext: brandContext || undefined,
            aspect: imgAspect,
            quality: imgQuality,
            refImages: refImages.length > 0 ? refImages : undefined,
          }),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(clientTimeout);
      }
      if (handle401(res)) { setBusy(false); return; }
      const data = await res.json();
      if (!res.ok || !data.images?.length) {
        updateMsg("image", assistantId, { status: "error", error: data.error || "تعذّر التوليد" });
        toast.error(data.error || "تعذّر التوليد");
        setBusy(false);
        return;
      }

      const img = data.images[0] as { data: string; mimeType: string };
      const replyText = editing ? "عدّلت الصورة ✨ — تقدر تكمّل تعديل تاني، أو تبدأ صورة جديدة." : "اتفضّل الصورة 🎨 — قولّي لو عايز أعدّل أي حاجة فيها.";
      updateMsg("image", assistantId, {
        status: "done",
        imageSrc: `data:${img.mimeType};base64,${img.data}`,
        imageData: img.data,
        mimeType: img.mimeType,
        text: replyText,
      });

      // حفظ في المكتبة + تزامن سحابي
      const path = await saveImageToLibrary(img.data, img.mimeType);
      if (path) {
        toast.success("اتحفظت في 📁 ملفاتي", { id: "autosave" });
        updateMsg("image", assistantId, { mediaPath: path });
        lastImageRef.current = { data: img.data, mimeType: img.mimeType, path };
        const cid = convoIds.current?.image;
        if (cid) {
          await addStudioMessage({ convoId: cid, role: "user", text: userText });
          await addStudioMessage({ convoId: cid, role: "assistant", text: replyText, mediaPath: path, mediaType: img.mimeType });
        }
      } else {
        lastImageRef.current = { data: img.data, mimeType: img.mimeType };
      }
    } catch (e) {
      const aborted = e instanceof Error && e.name === "AbortError";
      const msg = aborted ? "أخذ وقتاً أطول من المتوقّع — جرّب وضع «سريع ⚡» أو حاول تاني" : "تعذّر الاتصال — تأكد من الإنترنت وحاول مرة أخرى";
      updateMsg("image", assistantId, { status: "error", error: msg });
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  async function runVideo(text: string, userText: string, assistantId: string, attachedRef: RefImg | null) {
    setElapsed(0);
    try {
      let startImg: { mimeType: string; data: string } | null = null;
      if (attachedRef) {
        startImg = { mimeType: attachedRef.mimeType, data: attachedRef.data };
      } else if (lastImageRef.current?.data) {
        startImg = { mimeType: lastImageRef.current.mimeType, data: lastImageRef.current.data };
      }

      const res = await fetch("/api/video-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: text,
          aspect: vidAspect,
          model: vidQuality,
          refImage: startImg ?? undefined,
        }),
      });
      if (handle401(res)) { setBusy(false); return; }
      const data = await res.json();
      if (!res.ok || !data.operationName) {
        updateMsg("video", assistantId, { status: "error", error: data.error || "تعذّر بدء التوليد" });
        toast.error(data.error || "تعذّر بدء التوليد");
        setBusy(false);
        return;
      }

      updateMsg("video", assistantId, { text: "بصنع الفيديو دلوقتي 🎬 — عادةً من دقيقة لـ 3 دقايق، سيبك في الصفحة." });
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);

      const opName = data.operationName as string;
      pollRef.current = setInterval(async () => {
        try {
          const pollRes = await fetch(`/api/video-generate?op=${encodeURIComponent(opName)}`);
          const pollData = await pollRes.json();

          if (pollData.error && pollData.done !== false) {
            stopTimers();
            updateMsg("video", assistantId, { status: "error", error: pollData.error });
            toast.error(pollData.error);
            setBusy(false);
            return;
          }
          if (pollData.done && pollData.videoUri) {
            stopTimers();
            const proxyUrl = `/api/video-generate?download=${encodeURIComponent(pollData.videoUri)}`;
            updateMsg("video", assistantId, { text: "خلص التوليد — بحضّر المعاينة… ⏳" });
            const replyText = "🎬 الفيديو جاهز! اتحفظ في ملفاتي تلقائياً.";
            try {
              const r = await fetch(proxyUrl);
              const blob = r.ok ? await r.blob() : null;
              if (blob && blob.size > 1000) {
                const objUrl = URL.createObjectURL(blob);
                updateMsg("video", assistantId, { status: "done", videoSrc: objUrl, text: replyText });
                const path = await saveVideoToLibrary(blob);
                if (path) {
                  toast.success("اتحفظ في 📁 ملفاتي", { id: "autosave-vid" });
                  updateMsg("video", assistantId, { mediaPath: path });
                  const cid = convoIds.current?.video;
                  if (cid) {
                    await addStudioMessage({ convoId: cid, role: "user", text: userText });
                    await addStudioMessage({ convoId: cid, role: "assistant", text: replyText, mediaPath: path, mediaType: "video" });
                  }
                }
              } else {
                updateMsg("video", assistantId, { status: "done", videoSrc: proxyUrl, text: "🎬 الفيديو جاهز!" });
              }
            } catch {
              updateMsg("video", assistantId, { status: "done", videoSrc: proxyUrl, text: "🎬 الفيديو جاهز!" });
            }
            setBusy(false);
          }
        } catch {
          // تجاهل أخطاء polling المؤقتة
        }
      }, 5_000);
    } catch {
      updateMsg("video", assistantId, { status: "error", error: "تعذّر الاتصال" });
      toast.error("تعذّر الاتصال");
      setBusy(false);
    }
  }

  function newSession() {
    if (busy) return;
    if (mode === "image") lastImageRef.current = null;
    setThreads((prev) => ({ ...prev, [mode]: [] }));
    setRef(null);
    const cid = convoIds.current?.[mode];
    if (cid) void clearStudioConversation(cid);
    toast.success("بدأنا من جديد ✨");
  }

  function downloadMedia(src: string, ext: string) {
    const a = document.createElement("a");
    a.href = src;
    a.download = `oji-${Date.now()}.${ext}`;
    a.target = "_blank";
    a.rel = "noopener";
    a.click();
  }

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const aspects = mode === "image" ? IMAGE_ASPECTS : VIDEO_ASPECTS;
  const currentAspect = mode === "image" ? imgAspect : vidAspect;

  return (
    <div className="flex flex-col h-[calc(100dvh-4rem)]">
      {/* شريط علوي */}
      <div className="border-b bg-card/60 backdrop-blur px-3 sm:px-4 py-2.5 space-y-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex rounded-lg border bg-background p-0.5">
            <button
              onClick={() => setMode("image")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                mode === "image" ? "gradient-brand text-white shadow" : "text-muted-foreground"
              }`}
            >
              <ImageLucide className="size-4" /> صور
            </button>
            <button
              onClick={() => setMode("video")}
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
          {mode === "image" && (
            <div className="inline-flex rounded-md border overflow-hidden text-xs">
              <button onClick={() => setImgQuality("fast")} disabled={busy} className={`px-2.5 py-1 ${imgQuality === "fast" ? "bg-primary text-primary-foreground" : "bg-card"}`}>سريع ⚡</button>
              <button onClick={() => setImgQuality("high")} disabled={busy} className={`px-2.5 py-1 ${imgQuality === "high" ? "bg-primary text-primary-foreground" : "bg-card"}`}>جودة عالية</button>
            </div>
          )}
          {mode === "video" && (
            <div className="inline-flex rounded-md border overflow-hidden text-xs">
              <button onClick={() => setVidQuality("fast")} disabled={busy} className={`px-2.5 py-1 ${vidQuality === "fast" ? "bg-primary text-primary-foreground" : "bg-card"}`}>سريع ⚡</button>
              <button onClick={() => setVidQuality("quality")} disabled={busy} className={`px-2.5 py-1 ${vidQuality === "quality" ? "bg-primary text-primary-foreground" : "bg-card"}`}>جودة عالية</button>
            </div>
          )}
          <label className="inline-flex items-center gap-1.5 text-xs cursor-pointer mr-auto">
            <input type="checkbox" checked={useBrand} onChange={(e) => setUseBrand(e.target.checked)} className="size-3.5" />
            هويتي
          </label>
        </div>
      </div>

      {/* الرسائل */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto overscroll-contain px-3 sm:px-4 py-4 space-y-4">
        {loadingHistory ? (
          <div className="h-full grid place-items-center">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
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
                  <button key={s} onClick={() => setInput(s)} className="rounded-full border bg-card px-3 py-1.5 text-xs hover:border-primary hover:bg-accent/50 transition-all">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={`flex ${m.role === "user" ? "justify-start" : "justify-end"}`}>
              <div className={`max-w-[85%] sm:max-w-[75%] w-fit rounded-2xl text-[15px] leading-relaxed break-words ${m.role === "user" ? "bg-primary text-primary-foreground px-4 py-2.5 shadow-sm" : "bg-card border p-2.5"}`}>
                {m.refPreview && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.refPreview} alt="مرفق" className="mb-2 max-h-40 rounded-lg object-cover" />
                )}
                {m.text && (
                  <p className={`text-sm leading-relaxed whitespace-pre-wrap break-words ${m.role === "assistant" && (m.imageSrc || m.videoSrc) ? "px-1.5 pt-1" : ""}`}>
                    {m.text}
                  </p>
                )}

                {m.status === "loading" && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground px-1.5 py-1.5">
                    <Loader2 className="size-4 animate-spin" />
                    {m.kind === "video" ? <span>بصنع الفيديو… {elapsed > 0 ? fmt(elapsed) : ""}</span> : <span>بصمّم الصورة…</span>}
                  </div>
                )}

                {m.status === "error" && <p className="text-sm text-destructive px-1.5 py-1">⚠️ {m.error}</p>}

                {m.imageSrc && (
                  <div className="mt-1.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={m.imageSrc} alt="الصورة المولّدة" className="rounded-xl w-full max-w-md" />
                    <div className="mt-2 px-1">
                      <Button variant="outline" size="sm" onClick={() => m.imageSrc && downloadMedia(m.imageSrc, m.mimeType?.includes("webp") ? "webp" : m.mimeType?.includes("png") ? "png" : "jpg")} className="text-xs">
                        <Download className="size-3.5" /> تحميل
                      </Button>
                    </div>
                  </div>
                )}

                {m.videoSrc && (
                  <div className="mt-1.5">
                    <video src={m.videoSrc} controls autoPlay loop playsInline className="rounded-xl w-full max-w-md" />
                    <div className="mt-2 px-1">
                      <Button variant="outline" size="sm" onClick={() => m.videoSrc && downloadMedia(m.videoSrc, "mp4")} className="text-xs">
                        <Download className="size-3.5" /> تحميل
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
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
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); } }}
            placeholder={mode === "image" ? "اكتب وصف الصورة أو طلب تعديل…" : "اكتب وصف الفيديو…"}
            rows={1}
            dir="auto"
            disabled={busy}
            className="resize-none min-h-11 max-h-32 py-2.5"
          />
          <Button variant="gradient" size="icon" onClick={() => void send()} disabled={busy || (!input.trim() && !ref)} className="shrink-0 size-11 rounded-xl" title="إرسال">
            {busy ? <Loader2 className="size-5 animate-spin" /> : <Send className="size-5" />}
          </Button>
        </div>
        <p className="mt-1.5 text-[11px] text-muted-foreground text-center">
          {mode === "image"
            ? "💡 شات الصور وشات الفيديو منفصلين، ومحفوظين على حسابك — بيظهروا على أي جهاز تسجّل منه."
            : "🎬 شات الفيديو منفصل، ومحفوظ على حسابك ويتزامن على كل أجهزتك. ممكن ترفق صورة بداية."}
        </p>
      </div>
    </div>
  );
}
