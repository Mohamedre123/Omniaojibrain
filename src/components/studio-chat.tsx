"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { saveImageToLibrary, saveVideoToLibrary, downloadAsBase64 } from "@/lib/media-library";
import {
  listStudioSessions,
  createStudioSession,
  deleteStudioSession,
  loadStudioMessages,
  addStudioMessage,
  type CloudMsg,
  type StudioSession,
} from "@/lib/studio-cloud";
import {
  ImageIcon as ImageLucide,
  Film,
  Loader2,
  Download,
  Paperclip,
  X,
  Send,
  Plus,
  Trash2,
  FolderOpen,
  Wand2,
  Layers,
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
  refPreviews?: string[];
  elapsedSec?: number; // عدّاد وقت توليد الفيديو لكل رسالة
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
  const [editMode, setEditMode] = useState(false); // تعديل على آخر صورة بدل توليد جديدة
  const [vidAspect, setVidAspect] = useState<"16:9" | "9:16">("16:9");
  const [vidQuality, setVidQuality] = useState<"fast" | "quality">("fast");
  const [useBrand, setUseBrand] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [imgRefs, setImgRefs] = useState<RefImg[]>([]); // صور مرجعية متعددة (حتى 3)
  const [vidStart, setVidStart] = useState<RefImg | null>(null); // صورة البداية
  const [vidEnd, setVidEnd] = useState<RefImg | null>(null); // صورة النهاية

  const [sessions, setSessions] = useState<Record<Mode, StudioSession[]>>({ image: [], video: [] });
  const [currentSession, setCurrentSession] = useState<Record<Mode, string>>({ image: "", video: "" });

  const messages = threads[mode];

  const lastImageRef = useRef<{ data?: string; mimeType: string; path?: string } | null>(null);
  const brandLogoCache = useRef<{ url: string; logo: { data: string; mimeType: string } | null } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  // مؤقّتات مستقلّة لكل فيديو جارٍ — يسمح بأكثر من توليد في نفس الوقت بدون توقّف
  const timersRef = useRef<Map<string, { poll?: ReturnType<typeof setInterval>; timer?: ReturnType<typeof setInterval> }>>(new Map());

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, mode, scrollToBottom]);

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((t) => { if (t.poll) clearInterval(t.poll); if (t.timer) clearInterval(t.timer); });
      timers.clear();
    };
  }, []);

  // ☁️ حمّل السيشنات من السحابة (تتزامن على كل الأجهزة) — كل وضع له عدّة سيشنات
  useEffect(() => {
    (async () => {
      const setup = async (m: Mode) => {
        let list = await listStudioSessions(m);
        if (list.length === 0) {
          const id = await createStudioSession(m, "جلسة 1");
          if (id) list = [{ id, title: "جلسة 1", updatedAt: new Date().toISOString() }];
        }
        return list;
      };
      const [imgList, vidList] = await Promise.all([setup("image"), setup("video")]);
      setSessions({ image: imgList, video: vidList });
      const imgCur = imgList[0]?.id || "";
      const vidCur = vidList[0]?.id || "";
      setCurrentSession({ image: imgCur, video: vidCur });

      const [img, vid] = await Promise.all([
        imgCur ? loadStudioMessages(imgCur, "image") : Promise.resolve([]),
        vidCur ? loadStudioMessages(vidCur, "video") : Promise.resolve([]),
      ]);
      setThreads({ image: img.map(cloudToChat), video: vid.map(cloudToChat) });
      const lastImg = [...img].reverse().find((mm) => mm.mediaPath && mm.imageSrc);
      if (lastImg?.mediaPath) lastImageRef.current = { mimeType: lastImg.mimeType || "image/png", path: lastImg.mediaPath };
      setLoadingHistory(false);
    })();
  }, []);

  async function switchSession(m: Mode, id: string) {
    if (!id || id === currentSession[m]) return;
    setCurrentSession((p) => ({ ...p, [m]: id }));
    const msgs = await loadStudioMessages(id, m);
    setThreads((p) => ({ ...p, [m]: msgs.map(cloudToChat) }));
    if (m === "image") {
      const lastImg = [...msgs].reverse().find((mm) => mm.mediaPath && mm.imageSrc);
      lastImageRef.current = lastImg?.mediaPath ? { mimeType: lastImg.mimeType || "image/png", path: lastImg.mediaPath } : null;
    }
  }

  async function createNewSession() {
    const list = sessions[mode];
    const title = `جلسة ${list.length + 1}`;
    const id = await createStudioSession(mode, title);
    if (!id) { toast.error("تعذّر إنشاء جلسة"); return; }
    setSessions((p) => ({ ...p, [mode]: [{ id, title, updatedAt: new Date().toISOString() }, ...p[mode]] }));
    setCurrentSession((p) => ({ ...p, [mode]: id }));
    setThreads((p) => ({ ...p, [mode]: [] }));
    if (mode === "image") lastImageRef.current = null;
    toast.success("جلسة جديدة ✨");
  }

  async function removeSession() {
    const id = currentSession[mode];
    if (!id) return;
    const rest = sessions[mode].filter((s) => s.id !== id);
    await deleteStudioSession(id);
    if (rest.length === 0) {
      const nid = await createStudioSession(mode, "جلسة 1");
      const nlist = nid ? [{ id: nid, title: "جلسة 1", updatedAt: new Date().toISOString() }] : [];
      setSessions((p) => ({ ...p, [mode]: nlist }));
      setCurrentSession((p) => ({ ...p, [mode]: nid || "" }));
      setThreads((p) => ({ ...p, [mode]: [] }));
    } else {
      setSessions((p) => ({ ...p, [mode]: rest }));
      await switchSession(mode, rest[0].id);
    }
    if (mode === "image") lastImageRef.current = null;
    toast.success("اتحذفت الجلسة");
  }

  const updateMsg = useCallback((m: Mode, id: string, patch: Partial<ChatMsg>) => {
    setThreads((prev) => ({
      ...prev,
      [m]: prev[m].map((msg) => (msg.id === id ? { ...msg, ...patch } : msg)),
    }));
  }, []);

  function readFile(file: File | null, cb: (r: RefImg) => void) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("الصورة أكبر من 5MB"); return; }
    if (!file.type.startsWith("image/")) { toast.error("الملف لازم يكون صورة"); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const r = reader.result as string;
      cb({ data: r.split(",")[1] || "", mimeType: file.type, previewUrl: URL.createObjectURL(file), name: file.name });
    };
    reader.readAsDataURL(file);
  }

  // إضافة صور مرجعية متعددة (وضع الصور — حتى 3)
  function addImgRefs(files: FileList | null) {
    if (!files) return;
    const room = 3 - imgRefs.length;
    if (room <= 0) { toast.error("الحدّ الأقصى 3 صور مرجعية"); return; }
    Array.from(files).slice(0, room).forEach((f) =>
      readFile(f, (r) => setImgRefs((p) => (p.length < 3 ? [...p, r] : p)))
    );
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

  function stopTimersFor(id: string) {
    const t = timersRef.current.get(id);
    if (t) {
      if (t.poll) clearInterval(t.poll);
      if (t.timer) clearInterval(t.timer);
      timersRef.current.delete(id);
    }
  }

  function bumpElapsed(id: string) {
    setThreads((prev) => ({
      ...prev,
      video: prev.video.map((m) => (m.id === id ? { ...m, elapsedSec: (m.elapsedSec || 0) + 1 } : m)),
    }));
  }

  async function send() {
    const text = input.trim();
    const activeMode = mode;

    if (activeMode === "image" && !text && imgRefs.length === 0) return;
    if (activeMode === "video" && !text && !vidStart && !vidEnd) return;

    const userText = text || (activeMode === "image" ? "ولّد صورة من المرفقات" : "ولّد فيديو من الإطارات المرفقة");
    const previews =
      activeMode === "image"
        ? imgRefs.map((r) => r.previewUrl)
        : [vidStart?.previewUrl, vidEnd?.previewUrl].filter((u): u is string => !!u);

    const userMsg: ChatMsg = { id: uid(), role: "user", text: userText, refPreviews: previews, kind: activeMode };
    const assistantId = uid();
    const assistantMsg: ChatMsg = { id: assistantId, role: "assistant", kind: activeMode, status: "loading" };

    setThreads((prev) => ({ ...prev, [activeMode]: [...prev[activeMode], userMsg, assistantMsg] }));
    setInput("");

    const sid = currentSession[activeMode];
    // بنشغّلها في الخلفية — العميل يقدر يكمّل ويبعت تاني بدون ما يستنى
    if (activeMode === "image") {
      const attached = imgRefs;
      setImgRefs([]);
      void runImage(text, userText, assistantId, attached, sid, editMode);
    } else {
      const start = vidStart, end = vidEnd;
      setVidStart(null);
      setVidEnd(null);
      void runVideo(text, userText, assistantId, start, end, sid);
    }
  }

  async function runImage(text: string, userText: string, assistantId: string, attachedRefs: RefImg[], sessionId: string, useEdit: boolean) {
    try {
      const brand = await getBrandIdentity();
      const brandContext = brand.text;

      const refImages: Array<{ mimeType: string; data: string }> = [];
      let editing = false;

      if (attachedRefs.length > 0) {
        // المستخدم رفق صورة/صور → مرجع للهوية
        for (const r of attachedRefs.slice(0, 3)) {
          refImages.push(await shrinkImage(r.data, r.mimeType));
        }
      } else if (useEdit && lastImageRef.current) {
        // وضع «تعديل» مفعّل → عدّل على آخر صورة اتعملت
        let last = lastImageRef.current.data ? { mimeType: lastImageRef.current.mimeType, data: lastImageRef.current.data } : null;
        if (!last && lastImageRef.current.path) {
          const dl = await downloadAsBase64(lastImageRef.current.path);
          if (dl) { last = dl; lastImageRef.current.data = dl.data; }
        }
        if (last) { refImages.push(await shrinkImage(last.data, last.mimeType)); editing = true; }
      }

      const editNote = editing
        ? " IMPORTANT: An existing generated image is attached. Apply ONLY the user's requested change to THAT exact image while keeping everything else 100% identical (same subject, composition, background, colors, identity). Do not regenerate a different image."
        : attachedRefs.length > 0
        ? ` IMPORTANT: ${attachedRefs.length} reference image(s) are attached — keep the product/subject identity (logo, packaging, shape, faces) 100% identical to the reference(s); only build the requested scene around them.`
        : "";

      // الشعار كمرجع ألوان للتوليد الجديد فقط (لو فيه مكان)
      let logoNote = "";
      if (brand.logo && attachedRefs.length === 0 && !editing && refImages.length < 3) {
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
      if (handle401(res)) return;
      const data = await res.json();
      if (!res.ok || !data.images?.length) {
        updateMsg("image", assistantId, { status: "error", error: data.error || "تعذّر التوليد" });
        toast.error(data.error || "تعذّر التوليد");
        return;
      }

      const img = data.images[0] as { data: string; mimeType: string };
      const replyText = editing
        ? "عدّلت الصورة ✨ — التعديل مفعّل، فأي طلب جاي هيتعدّل على دي. اقفل «تعديل» عشان صورة جديدة."
        : "اتفضّل الصورة 🎨 — فعّل زرّ «تعديل» عشان تعدّل عليها، أو اكتب برومبت جديد لصورة تانية.";
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
        const cid = sessionId;
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
    }
  }

  async function runVideo(text: string, userText: string, assistantId: string, start: RefImg | null, end: RefImg | null, sessionId: string) {
    try {
      let startImg: { mimeType: string; data: string } | null = null;
      if (start) {
        startImg = await shrinkImage(start.data, start.mimeType);
      } else if (lastImageRef.current?.data) {
        startImg = await shrinkImage(lastImageRef.current.data, lastImageRef.current.mimeType);
      }
      const endImg = end ? await shrinkImage(end.data, end.mimeType) : null;

      const res = await fetch("/api/video-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: text || "حرّك المشهد بين صورة البداية والنهاية بسلاسة سينمائية",
          aspect: vidAspect,
          model: vidQuality,
          refImage: startImg ?? undefined,
          endImage: endImg ?? undefined,
        }),
      });
      if (handle401(res)) return;
      const data = await res.json();
      if (!res.ok || !data.operationName) {
        updateMsg("video", assistantId, { status: "error", error: data.error || "تعذّر بدء التوليد" });
        toast.error(data.error || "تعذّر بدء التوليد");
        return;
      }

      updateMsg("video", assistantId, { text: "بصنع الفيديو دلوقتي 🎬 — عادةً من دقيقة لـ 3 دقايق. تقدر تكمّل شغلك عادي.", elapsedSec: 0 });

      const opName = data.operationName as string;
      const timer = setInterval(() => bumpElapsed(assistantId), 1000);
      const poll = setInterval(async () => {
        try {
          const pollRes = await fetch(`/api/video-generate?op=${encodeURIComponent(opName)}`);
          const pollData = await pollRes.json();

          if (pollData.error && pollData.done !== false) {
            stopTimersFor(assistantId);
            updateMsg("video", assistantId, { status: "error", error: pollData.error });
            toast.error(pollData.error);
            return;
          }
          if (pollData.done && pollData.videoUri) {
            stopTimersFor(assistantId);
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
                  const cid = sessionId;
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
          }
        } catch {
          // تجاهل أخطاء polling المؤقتة
        }
      }, 5_000);

      timersRef.current.set(assistantId, { timer, poll });
    } catch {
      stopTimersFor(assistantId);
      updateMsg("video", assistantId, { status: "error", error: "تعذّر الاتصال" });
      toast.error("تعذّر الاتصال");
    }
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

          <Link href="/studio/tools" className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium rounded-full border border-primary/40 bg-primary/10 text-primary px-3 py-1 hover:bg-primary/20 transition-colors">
            <Layers className="size-4" /> 🧰 أدوات الصور
          </Link>
          <Link href="/studio/library" className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground hover:text-primary">
            <FolderOpen className="size-4" /> ملفاتي
          </Link>
        </div>

        {/* السيشنات — كل جلسة محفوظة وتكمّل من حيث وقفت */}
        <div className="flex items-center gap-1.5">
          <select
            value={currentSession[mode]}
            onChange={(e) => void switchSession(mode, e.target.value)}
            className="flex-1 h-8 px-2 rounded-md border border-input bg-background text-xs max-w-[220px]"
            title="اختر جلسة"
          >
            {sessions[mode].map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
          </select>
          <Button variant="outline" size="sm" onClick={() => void createNewSession()} className="text-xs h-8">
            <Plus className="size-3.5" /> جلسة جديدة
          </Button>
          {sessions[mode].length > 0 && (
            <Button variant="ghost" size="icon" onClick={() => void removeSession()} className="size-8 text-destructive" title="حذف الجلسة">
              <Trash2 className="size-3.5" />
            </Button>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {aspects.map((a) => (
            <button
              key={a.value}
              onClick={() => (mode === "image" ? setImgAspect(a.value) : setVidAspect(a.value as "16:9" | "9:16"))}
              className={`px-2.5 py-1 rounded-md text-xs border transition-all ${
                currentAspect === a.value ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:border-primary/50"
              }`}
            >
              {a.label}
            </button>
          ))}
          {mode === "image" && (
            <div className="inline-flex rounded-md border overflow-hidden text-xs">
              <button onClick={() => setImgQuality("fast")} className={`px-2.5 py-1 ${imgQuality === "fast" ? "bg-primary text-primary-foreground" : "bg-card"}`}>سريع ⚡</button>
              <button onClick={() => setImgQuality("high")} className={`px-2.5 py-1 ${imgQuality === "high" ? "bg-primary text-primary-foreground" : "bg-card"}`}>جودة عالية</button>
            </div>
          )}
          {mode === "image" && (
            <button
              onClick={() => setEditMode((v) => !v)}
              title="لما يكون مفعّل، التوليد يعدّل على آخر صورة بدل ما يعمل جديدة"
              className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs transition-colors ${editMode ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:border-primary/50"}`}
            >
              ✏️ تعديل {editMode ? "(مفعّل)" : ""}
            </button>
          )}
          {mode === "video" && (
            <div className="inline-flex rounded-md border overflow-hidden text-xs">
              <button onClick={() => setVidQuality("fast")} className={`px-2.5 py-1 ${vidQuality === "fast" ? "bg-primary text-primary-foreground" : "bg-card"}`}>سريع ⚡</button>
              <button onClick={() => setVidQuality("quality")} className={`px-2.5 py-1 ${vidQuality === "quality" ? "bg-primary text-primary-foreground" : "bg-card"}`}>جودة عالية</button>
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
              <div className={`max-w-[94%] sm:max-w-[88%] w-fit rounded-2xl text-[15px] leading-relaxed break-words ${m.role === "user" ? "bg-primary text-primary-foreground px-4 py-2.5 shadow-sm" : "bg-card border p-2.5"}`}>
                {m.refPreviews && m.refPreviews.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    {m.refPreviews.map((u, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={i} src={u} alt="مرفق" className="size-16 rounded-lg object-cover border" />
                    ))}
                  </div>
                )}
                {m.text && (
                  <p className={`text-sm leading-relaxed whitespace-pre-wrap break-words ${m.role === "assistant" && (m.imageSrc || m.videoSrc) ? "px-1.5 pt-1" : ""}`}>
                    {m.text}
                  </p>
                )}

                {m.status === "loading" && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground px-1.5 py-1.5">
                    <Loader2 className="size-4 animate-spin" />
                    {m.kind === "video" ? <span>بصنع الفيديو… {m.elapsedSec ? fmt(m.elapsedSec) : ""}</span> : <span>بصمّم الصورة…</span>}
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
        {/* مرفقات وضع الصور — حتى 3 صور مرجعية */}
        {mode === "image" && imgRefs.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {imgRefs.map((r, i) => (
              <div key={i} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={r.previewUrl} alt={r.name} className="size-12 rounded-lg object-cover border" />
                <button
                  onClick={() => setImgRefs((p) => p.filter((_, idx) => idx !== i))}
                  className="absolute -top-1.5 -right-1.5 size-5 rounded-full bg-destructive text-white grid place-items-center shadow"
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* مرفقات وضع الفيديو — صورة بداية + صورة نهاية */}
        {mode === "video" && (
          <div className="mb-2 flex gap-2">
            {([
              { label: "صورة البداية", img: vidStart, set: setVidStart },
              { label: "صورة النهاية", img: vidEnd, set: setVidEnd },
            ] as const).map((slot) => (
              <div key={slot.label} className="flex-1">
                {slot.img ? (
                  <div className="relative h-16 rounded-lg border overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={slot.img.previewUrl} alt={slot.label} className="w-full h-full object-cover" />
                    <span className="absolute bottom-0 inset-x-0 bg-black/55 text-white text-[10px] text-center py-0.5">{slot.label}</span>
                    <button onClick={() => slot.set(null)} className="absolute top-1 right-1 size-5 rounded-full bg-destructive text-white grid place-items-center">
                      <X className="size-3" />
                    </button>
                  </div>
                ) : (
                  <label className="h-16 rounded-lg border-2 border-dashed grid place-items-center cursor-pointer hover:border-primary transition-colors text-[11px] text-muted-foreground gap-1">
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => readFile(e.target.files?.[0] || null, slot.set)} />
                    <Paperclip className="size-4" /> {slot.label}
                  </label>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2">
          {mode === "image" && (
            <label className={`shrink-0 size-11 rounded-xl border grid place-items-center cursor-pointer hover:border-primary transition-colors relative ${imgRefs.length >= 3 ? "opacity-50 pointer-events-none" : ""}`} title="أضف صور مرجعية (حتى 3)">
              <input type="file" accept="image/*" multiple className="hidden" disabled={imgRefs.length >= 3} onChange={(e) => addImgRefs(e.target.files)} />
              <Paperclip className="size-5 text-muted-foreground" />
            </label>
          )}
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); } }}
            placeholder={mode === "image" ? "اكتب وصف الصورة أو طلب تعديل…" : "اكتب وصف الفيديو…"}
            rows={1}
            dir="auto"
            className="resize-none min-h-11 max-h-32 py-2.5"
          />
          <Button
            variant="gradient"
            size="icon"
            onClick={() => void send()}
            disabled={mode === "image" ? !input.trim() && imgRefs.length === 0 : !input.trim() && !vidStart && !vidEnd}
            className="shrink-0 size-11 rounded-xl"
            title="إرسال"
          >
            <Send className="size-5" />
          </Button>
        </div>
        <p className="mt-1.5 text-[11px] text-muted-foreground text-center">
          {mode === "image"
            ? "💡 تقدر ترفق حتى 3 صور مرجعية (زي Gemini). الشات محفوظ ويتزامن على كل أجهزتك."
            : "🎬 ارفق صورة بداية و/أو نهاية (Start & End frame). الشات محفوظ ويتزامن على كل أجهزتك."}
        </p>
      </div>
    </div>
  );
}
