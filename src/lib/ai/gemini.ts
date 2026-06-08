import { GoogleGenAI } from "@google/genai";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  imageData?: { mimeType: string; data: string }[];
};

let _client: GoogleGenAI | null = null;
function client() {
  if (!_client) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("GEMINI_API_KEY is not set");
    _client = new GoogleGenAI({ apiKey: key });
  }
  return _client;
}

// نماذج بترتيب الأولوية + fallbacks للأخطاء 503
const MODELS = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.0-flash"];

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function isRetryable(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes("503") ||
    msg.includes("UNAVAILABLE") ||
    msg.includes("overloaded") ||
    msg.includes("rate limit")
  );
}

export async function* streamChat(opts: {
  systemPrompt: string;
  messages: ChatMessage[];
}): AsyncGenerator<string> {
  const contents = opts.messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [
      ...(m.imageData?.map((img) => ({
        inlineData: { mimeType: img.mimeType, data: img.data },
      })) ?? []),
      { text: m.content },
    ],
  }));

  let lastError: unknown;

  // جرّب كلّ نموذج، مع 2 retries لكل واحد
  for (const model of MODELS) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await client().models.generateContentStream({
          model,
          contents,
          config: {
            systemInstruction: opts.systemPrompt,
            temperature: 0.85,
            maxOutputTokens: 8192,
          },
        });

        for await (const chunk of response) {
          const text = chunk.text;
          if (text) yield text;
        }
        return; // نجح
      } catch (e) {
        lastError = e;
        if (!isRetryable(e)) break;
        await sleep(800 * (attempt + 1));
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error("توليد الردّ فشل بعد عدّة محاولات");
}

export async function generateText(opts: {
  systemPrompt: string;
  prompt: string;
}): Promise<string> {
  let lastError: unknown;

  for (const model of MODELS) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await client().models.generateContent({
          model,
          contents: [{ role: "user", parts: [{ text: opts.prompt }] }],
          config: {
            systemInstruction: opts.systemPrompt,
            temperature: 0.7,
          },
        });
        return response.text ?? "";
      } catch (e) {
        lastError = e;
        if (!isRetryable(e)) break;
        await sleep(800 * (attempt + 1));
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error("توليد الردّ فشل");
}
