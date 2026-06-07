"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Brain, Copy, Check, Save } from "lucide-react";
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

  function copy() {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    toast.success("تمّ النسخ");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}>
      {!isUser && (
        <div className="shrink-0 size-9 rounded-lg gradient-brand grid place-items-center">
          <Brain className="size-5 text-white" />
        </div>
      )}
      <div className={cn("group max-w-[85%]", isUser && "ml-auto")}>
        <div
          className={cn(
            "rounded-2xl px-4 py-3 text-sm leading-relaxed",
            isUser
              ? "bg-primary text-primary-foreground rounded-tr-sm"
              : "bg-muted rounded-tl-sm"
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none prose-pre:bg-background/50 prose-pre:text-foreground prose-headings:font-bold prose-p:my-2 prose-ul:my-2 prose-ol:my-2">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content || (streaming ? "..." : "")}
              </ReactMarkdown>
            </div>
          )}
          {streaming && <span className="inline-block ml-1 size-2 bg-current animate-pulse rounded-full" />}
        </div>
        {!isUser && !streaming && message.content && (
          <div className="flex gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={copy}>
              {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
              نسخ
            </Button>
            {onSave && (
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
