"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageBubble } from "./message-bubble";
import { VoiceInput } from "./voice-input";
import { FileUploadButton, FilePreviewList, type UploadedFile } from "./file-upload";
import { MODE_LABELS, type WorkflowMode } from "@/lib/ai/prompts";
import type { BusinessTemplate } from "@/lib/templates";
import type { Conversation, Message, Deliverable } from "@/types/db";
import { Send, Loader2, Sparkles, Save } from "lucide-react";

type SaveFn = (payload: { kind: Deliverable["kind"]; title: string; content: string }) => Promise<void>;

const MODE_TO_KIND: Record<WorkflowMode, Deliverable["kind"]> = {
  chat: "note",
  strategy: "strategy",
  design: "design_prompt",
  video: "video_prompt",
  competitor: "note",
};

export function ChatPanel({
  conversation,
  mode,
  template,
  messages,
  brief,
  onAddMessage,
  onReplaceMessage,
  onSaveDeliverable,
}: {
  conversation: Conversation;
  mode: WorkflowMode;
  template: BusinessTemplate;
  /** الرسائل دلوقتي بتيجي من الـ Workspace (Lifted State) عشان متختفيش لما نبدّل tabs */
  messages: Message[];
  brief: string | null;
  onAddMessage: (msg: Message) => void;
  onReplaceMessage: (tempId: string, finalMsg: Message) => void;
  onSaveDeliverable: SaveFn;
}) {
  const [input, setInput] = useState("");
  const [aiModel, setAiModel] = useState("gemini"); // "gemini" أو معرّف موديل Claude
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [streamingForConvo, setStreamingForConvo] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, streamingText, scrollToBottom]);

  async function sendMessage(text: string) {
    // اسمح بالإرسال لو فيه ملفات حتى بدون نص
    if (!text.trim() && files.length === 0) return;
    if (streaming) return;

    const tempUserId = `temp-user-${Date.now()}`;
    const tempAssistantId = `temp-asst-${Date.now()}`;
    const convoId = conversation.id;

    const attachmentsForUI = files.map((f) => ({
      url: f.previewUrl,
      type: f.type,
      name: f.name,
    }));

    const attachmentsForAPI = files.map((f) => ({
      url: f.previewUrl,
      type: f.type,
      name: f.name,
      base64: f.base64,
    }));

    const userMsg: Message = {
      id: tempUserId,
      conversation_id: convoId,
      user_id: "",
      role: "user",
      content: text || "(صور مرفقة)",
      attachments: attachmentsForUI,
      created_at: new Date().toISOString(),
    };

    onAddMessage(userMsg);
    setInput("");
    setFiles([]);
    setStreaming(true);
    setStreamingForConvo(convoId);
    setStreamingText("");

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversation_id: convoId,
          message: text || "حلّل الصور المرفقة وقدّم ملاحظاتك",
          attachments: attachmentsForAPI,
          provider: aiModel === "gemini" ? "gemini" : aiModel.startsWith("gpt") ? "openai" : "claude",
          model: aiModel === "gemini" ? undefined : aiModel,
        }),
        signal: controller.signal,
      });

      if (res.status === 401) {
        toast.error("انتهت جلستك — جاري تحويلك لتسجيل الدخول");
        setTimeout(() => { window.location.href = "/login?redirect=" + encodeURIComponent(window.location.pathname); }, 1200);
        setStreaming(false);
        setStreamingForConvo(null);
        return;
      }
      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({ error: "حدثت مشكلة" }));
        toast.error(err.error ?? "حدثت مشكلة");
        setStreaming(false);
        setStreamingForConvo(null);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setStreamingText(acc);
      }

      const assistantMsg: Message = {
        id: tempAssistantId,
        conversation_id: convoId,
        user_id: "",
        role: "assistant",
        content: acc,
        attachments: [],
        created_at: new Date().toISOString(),
      };
      onAddMessage(assistantMsg);
      setStreamingText("");
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        toast.error("تعذّر الاتصال");
      }
    } finally {
      setStreaming(false);
      setStreamingForConvo(null);
      abortRef.current = null;
    }
  }

  function stopStream() {
    abortRef.current?.abort();
    setStreaming(false);
    setStreamingForConvo(null);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  function handleVoice(text: string) {
    setInput((p) => (p ? `${p} ${text}` : text));
  }

  async function saveLastResponse() {
    const last = [...messages].reverse().find((m) => m.role === "assistant");
    if (!last) return;
    const title = `${MODE_LABELS[mode].label} - ${new Date().toLocaleDateString("ar")}`;
    await onSaveDeliverable({
      kind: MODE_TO_KIND[mode],
      title,
      content: last.content,
    });
  }

  // أمنع توصيات الـ Lint بدون فائدة
  void onReplaceMessage;

  const starters = !brief && messages.length === 0
    ? template.starterQuestions
    : [];

  const modeStarters: Record<WorkflowMode, string[]> = {
    chat: ["اقترح عشرَ أفكارٍ لمحتوى إنستجرام", "اكتب خمسة عناوينَ تسويقيةٍ لمنتجي", "راجع نصّي الترويجي"],
    strategy: ["ضع خطةَ تسويقٍ شهرية", "اقترح ميزانيةَ إعلاناتٍ مناسبة", "حدّد مؤشراتِ الأداء (KPIs)"],
    design: ["برومبتُ تصميمٍ لإعلانِ منتج", "صف لي صورةَ Lifestyle للعلامة", "برومبتُ خلفيةٍ لقصةِ إنستجرام"],
    video: ["برومبتُ فيديو Reel بأبعاد 9:16 ومدة 8 ثوانٍ", "Start frame و End frame لمنتج", "سكربتُ إعلانِ فيديو 30 ثانية"],
    competitor: ["حلّل منافسي الرئيسي", "ما الفرصُ التي يفوّتها منافسوني؟", "قارنّي بـ 3 من منافسيّ"],
  };

  const isStreamingHere = streaming && streamingForConvo === conversation.id;

  return (
    <div className="flex flex-col h-[65vh] min-h-[500px]">
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pr-1">
        {messages.length === 0 && !isStreamingHere && (
          <div className="text-center py-10">
            <div className="mx-auto size-14 rounded-full gradient-brand grid place-items-center mb-3">
              <Sparkles className="size-7 text-white" />
            </div>
            <h3 className="font-semibold text-lg">{MODE_LABELS[mode].label}</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
              {MODE_LABELS[mode].description}
            </p>
            {(starters.length > 0 || modeStarters[mode].length > 0) && (
              <div className="mt-6 flex flex-wrap justify-center gap-2 max-w-2xl mx-auto">
                {[...starters, ...modeStarters[mode]].map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="rounded-full border bg-card px-4 py-2 text-sm text-right hover:border-primary hover:bg-accent/50 transition-all"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {messages.map((m) => (
          <MessageBubble
            key={m.id}
            message={m}
            onSave={
              m.role === "assistant"
                ? () => onSaveDeliverable({
                    kind: MODE_TO_KIND[mode],
                    title: `${MODE_LABELS[mode].label} - ${new Date().toLocaleDateString("ar")}`,
                    content: m.content,
                  })
                : undefined
            }
          />
        ))}

        {isStreamingHere && streamingText && (
          <MessageBubble
            message={{
              id: "streaming",
              conversation_id: conversation.id,
              user_id: "",
              role: "assistant",
              content: streamingText,
              attachments: [],
              created_at: new Date().toISOString(),
            }}
            streaming
          />
        )}

        {isStreamingHere && !streamingText && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Oji يفكّر...
          </div>
        )}
      </div>

      <div className="border-t pt-3 mt-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-muted-foreground">الموديل:</span>
          <select
            value={aiModel}
            onChange={(e) => setAiModel(e.target.value)}
            className="h-8 px-2 rounded-md border border-input bg-background text-xs"
            title="اختر موديل الذكاء الاصطناعي"
          >
            <option value="gemini">Gemini (افتراضي)</option>
            <option value="gpt-4o">ChatGPT (GPT-4o)</option>
            <option value="gpt-4o-mini">ChatGPT (GPT-4o mini — الأسرع)</option>
            <option value="claude-opus-4-8">Claude Opus 4.8 (الأقوى)</option>
            <option value="claude-opus-4-7">Claude Opus 4.7</option>
            <option value="claude-sonnet-4-6">Claude Sonnet 4.6</option>
            <option value="claude-haiku-4-5">Claude Haiku 4.5 (الأسرع)</option>
          </select>
        </div>
        <FilePreviewList files={files} onRemove={(id) => setFiles((p) => p.filter((f) => f.id !== id))} />
        <div className="flex items-end gap-2">
          <FileUploadButton files={files} onFilesChange={setFiles} disabled={isStreamingHere} />
          <VoiceInput onTranscript={handleVoice} disabled={isStreamingHere} />
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`اكتب رسالتك... (${MODE_LABELS[mode].label})`}
            rows={2}
            className="resize-none"
            disabled={isStreamingHere}
            dir="auto"
          />
          {isStreamingHere ? (
            <Button variant="destructive" size="icon" onClick={stopStream} title="إيقاف">
              <span className="size-3 bg-white rounded-sm" />
            </Button>
          ) : (
            <Button
              variant="gradient"
              size="icon"
              onClick={() => sendMessage(input)}
              disabled={!input.trim() && files.length === 0}
              title="إرسال"
            >
              <Send className="size-4" />
            </Button>
          )}
        </div>
        {messages.some((m) => m.role === "assistant") && (
          <div className="mt-2 flex justify-end">
            <Button variant="ghost" size="sm" onClick={saveLastResponse} className="text-xs">
              <Save className="size-3" />
              حفظُ آخرِ ردٍّ في المكتبة
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
