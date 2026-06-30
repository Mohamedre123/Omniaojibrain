// تكامل OpenAI (ChatGPT) عبر REST streaming — بدون SDK.
// يقرأ المفتاح من OPENAI_API_KEY (يُضبط في متغيّرات البيئة، لا يوضع في الكود).

import type { ChatMessage } from "./gemini";

const API_URL = "https://api.openai.com/v1/chat/completions";

// موديلات ChatGPT المتاحة للاختيار (الأحدث)
export const OPENAI_MODELS = [
  { id: "gpt-5.5", label: "ChatGPT (GPT-5.5 — الأقوى)" },
  { id: "gpt-5.4", label: "ChatGPT (GPT-5.4)" },
  { id: "gpt-5.4-mini", label: "ChatGPT (GPT-5.4 mini — الأسرع)" },
] as const;

export const DEFAULT_OPENAI_MODEL = "gpt-5.4";

export function isValidOpenAIModel(m: string | undefined): m is string {
  return !!m && OPENAI_MODELS.some((x) => x.id === m);
}

type OpenAIContent =
  | string
  | Array<
      | { type: "text"; text: string }
      | { type: "image_url"; image_url: { url: string } }
    >;

/** بثّ ردّ ChatGPT — نفس واجهة streamChat بتاعة Gemini */
export async function* streamOpenAI(opts: {
  systemPrompt: string;
  messages: ChatMessage[];
  model?: string;
  maxTokens?: number;
}): AsyncGenerator<string> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("مفتاح ChatGPT (OPENAI_API_KEY) غير مضبوط في الخادم");

  const model = isValidOpenAIModel(opts.model) ? opts.model : DEFAULT_OPENAI_MODEL;

  const messages: Array<{ role: string; content: OpenAIContent }> = [
    { role: "system", content: opts.systemPrompt },
  ];
  for (const m of opts.messages) {
    if (m.imageData && m.imageData.length > 0) {
      const parts: Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }> = [
        { type: "text", text: m.content || "(فارغ)" },
      ];
      for (const img of m.imageData) {
        parts.push({ type: "image_url", image_url: { url: `data:${img.mimeType};base64,${img.data}` } });
      }
      messages.push({ role: m.role, content: parts });
    } else {
      messages.push({ role: m.role, content: m.content || "(فارغ)" });
    }
  }

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: opts.maxTokens ?? 8000,
      messages,
      stream: true,
    }),
  });

  if (!res.ok || !res.body) {
    let msg = `HTTP ${res.status}`;
    try {
      const j = await res.json();
      msg = j?.error?.message || msg;
    } catch {}
    throw new Error(`ChatGPT: ${String(msg).slice(0, 200)}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const evt = JSON.parse(payload);
        const delta = evt?.choices?.[0]?.delta?.content;
        if (typeof delta === "string") yield delta;
      } catch {
        // تجاهل أسطر SSE غير المكتملة
      }
    }
  }
}
