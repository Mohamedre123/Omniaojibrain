// تكامل Claude (Anthropic) عبر REST streaming — بدون SDK.
// يقرأ المفتاح من ANTHROPIC_API_KEY (يُضبط في متغيّرات البيئة، لا يوضع في الكود).

import type { ChatMessage } from "./gemini";

const API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";

// موديلات Claude المتاحة للاختيار (الأقوى أولاً)
export const CLAUDE_MODELS = [
  { id: "claude-opus-4-8", label: "Claude Opus 4.8 (الأقوى)" },
  { id: "claude-opus-4-7", label: "Claude Opus 4.7" },
  { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6 (متوازن وسريع)" },
  { id: "claude-haiku-4-5", label: "Claude Haiku 4.5 (الأسرع)" },
] as const;

export const DEFAULT_CLAUDE_MODEL = "claude-opus-4-8";

export function isValidClaudeModel(m: string | undefined): m is string {
  return !!m && CLAUDE_MODELS.some((x) => x.id === m);
}

type AnthropicContentBlock =
  | { type: "text"; text: string }
  | { type: "image"; source: { type: "base64"; media_type: string; data: string } };

/** بثّ ردّ Claude — نفس واجهة streamChat بتاعة Gemini */
export async function* streamClaude(opts: {
  systemPrompt: string;
  messages: ChatMessage[];
  model?: string;
  maxTokens?: number;
}): AsyncGenerator<string> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("مفتاح Claude (ANTHROPIC_API_KEY) غير مضبوط في الخادم");

  const model = isValidClaudeModel(opts.model) ? opts.model : DEFAULT_CLAUDE_MODEL;

  const messages = opts.messages.map((m) => {
    const blocks: AnthropicContentBlock[] = [];
    for (const img of m.imageData ?? []) {
      blocks.push({ type: "image", source: { type: "base64", media_type: img.mimeType, data: img.data } });
    }
    blocks.push({ type: "text", text: m.content || "(فارغ)" });
    return { role: m.role, content: blocks };
  });

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": ANTHROPIC_VERSION,
    },
    body: JSON.stringify({
      model,
      max_tokens: opts.maxTokens ?? 16000,
      system: opts.systemPrompt,
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
    throw new Error(`Claude: ${String(msg).slice(0, 200)}`);
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
        if (evt.type === "content_block_delta" && evt.delta?.type === "text_delta") {
          yield evt.delta.text as string;
        }
      } catch {
        // تجاهل أسطر SSE غير المكتملة
      }
    }
  }
}
