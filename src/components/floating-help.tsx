"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { HelpCircle, X, Send, Loader2, Sparkles, Brain } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Msg = { role: "user" | "assistant"; content: string };

const STARTERS = [
  "كيف أُنشئُ استراتيجيةً متكاملة؟",
  "ما الفرقُ بين الأوضاع الأربعة؟",
  "كيف أرفعُ صورَ المنتج؟",
  "هل يمكنني مشاركةُ المشروع مع العميل؟",
];

export function FloatingHelp() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streamText, setStreamText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // أخفِ الزرّ العائم في الصفحات اللي فيها شريط إدخال سفلي (شات) عشان ما يغطّيش زر الإرسال
  const hideOnChat = ["/studio", "/assistant", "/projects"].some((p) => pathname?.startsWith(p));

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, streamText]);

  async function send(text: string) {
    if (!text.trim() || loading) return;
    const userMsg = { role: "user" as const, content: text };
    setMsgs((p) => [...p, userMsg]);
    setInput("");
    setLoading(true);
    setStreamText("");

    try {
      const res = await fetch("/api/help-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...msgs, userMsg] }),
      });
      if (!res.ok || !res.body) {
        toast.error("حدثت مشكلة");
        setLoading(false);
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setStreamText(acc);
      }
      setMsgs((p) => [...p, { role: "assistant", content: acc }]);
      setStreamText("");
    } catch {
      toast.error("تعذّر الاتصال");
    } finally {
      setLoading(false);
    }
  }

  // في صفحات الشات نخفي الزرّ تماماً (المساعد متاح من القائمة الجانبية)
  if (hideOnChat) return null;

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 left-6 z-40 size-14 rounded-full gradient-brand shadow-xl grid place-items-center text-white hover:scale-110 transition-transform"
        aria-label="مساعدة"
      >
        <HelpCircle className="size-6" />
        <span className="absolute -top-1 -left-1 size-3 bg-emerald-400 rounded-full animate-pulse" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 left-6 z-50 w-[calc(100vw-3rem)] max-w-md h-[600px] max-h-[80vh] rounded-2xl border bg-card shadow-2xl flex flex-col overflow-hidden">
      <div className="gradient-brand text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-lg bg-white/20 grid place-items-center">
            <Brain className="size-5" />
          </div>
          <div>
            <p className="font-semibold text-sm">هل تحتاجُ مساعدة؟</p>
            <p className="text-xs opacity-80">Oji هنا للإجابة على أسئلتك</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setOpen(false)} className="text-white hover:bg-white/20">
          <X className="size-4" />
        </Button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {msgs.length === 0 && (
          <div className="text-center py-6">
            <Sparkles className="size-8 mx-auto text-primary mb-2" />
            <p className="text-sm font-medium">ما الذي تودّ معرفته؟</p>
            <div className="mt-4 space-y-2">
              {STARTERS.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="block w-full text-right text-sm rounded-lg border bg-background p-2.5 hover:border-primary hover:bg-accent/50 transition-all"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        {msgs.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] w-fit rounded-2xl px-3 py-2 text-sm leading-relaxed break-words ${m.role === "user" ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted"}`}>
              {m.role === "user" ? (
                <p className="whitespace-pre-wrap">{m.content}</p>
              ) : (
                <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        ))}
        {streamText && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-2xl px-3 py-2 text-sm bg-muted">
              <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{streamText}</ReactMarkdown>
              </div>
            </div>
          </div>
        )}
        {loading && !streamText && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="size-3 animate-spin" />
            يفكّر...
          </div>
        )}
      </div>

      <div className="border-t p-3">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            placeholder="اكتب سؤالك..."
            rows={1}
            className="min-h-[40px] text-sm"
          />
          <Button variant="gradient" size="icon" onClick={() => send(input)} disabled={loading || !input.trim()}>
            <Send className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
