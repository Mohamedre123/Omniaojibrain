"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Brain, Copy, Check, Save, Volume2, Share2, Square } from "lucide-react";
import type { Message } from "@/types/db";
import { cn } from "@/lib/utils";

export function MessageBubble({
  message,
  streaming = false,
  onSave,
}: {
  message: Message;
  streaming?: boolean;
  onSave?: () => void;
}) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  function copy() {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    toast.success("تمّ النسخ");
    setTimeout(() => setCopied(false), 2000);
  }

  function speak() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      toast.error("القراءة الصوتية غير مدعومة في متصفحك");
      return;
    }
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const u = new SpeechSynthesisUtterance(message.content);
    u.lang = "ar-SA";
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
    setSpeaking(true);
  }

  async function share() {
    try {
      if (navigator.share) {
        await navigator.share({ text: message.content });
      } else {
        await navigator.clipboard.writeText(message.content);
        toast.success("اتنسخت للمشاركة");
      }
    } catch {
      // المستخدم ألغى المشاركة — تجاهل
    }
  }

  return (
    <div className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}>
      {!isUser && (
        <div className="shrink-0 size-9 rounded-lg gradient-brand grid place-items-center">
          <Brain className="size-5 text-white" />
        </div>
      )}
      <div className={cn("group max-w-[85%] min-w-0", isUser && "ml-auto")}>
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed break-words",
            isUser
              ? "bg-primary text-primary-foreground rounded-tr-sm w-fit ml-auto shadow-sm"
              : "bg-muted rounded-tl-sm"
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none prose-pre:bg-background/50 prose-pre:text-foreground prose-headings:font-bold prose-p:my-2 prose-ul:my-2 prose-ol:my-2">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content || (streaming ? "..." : "")}
              </ReactMarkdown>
            </div>
          )}
          {streaming && <span className="inline-block ml-1 size-2 bg-current animate-pulse rounded-full" />}
        </div>
        {!streaming && message.content && (
          <div className="flex flex-wrap gap-1 mt-1 opacity-60 hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={copy}>
              {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
              نسخ
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={speak}>
              {speaking ? <Square className="size-3" /> : <Volume2 className="size-3" />}
              {speaking ? "إيقاف" : "قراءة"}
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={share}>
              <Share2 className="size-3" />
              مشاركة
            </Button>
            {!isUser && onSave && (
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onSave}>
                <Save className="size-3" />
                حفظ
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
