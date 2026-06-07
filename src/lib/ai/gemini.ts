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

const MODEL = "gemini-2.5-flash";

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

  const response = await client().models.generateContentStream({
    model: MODEL,
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
}

export async function generateText(opts: {
  systemPrompt: string;
  prompt: string;
}): Promise<string> {
  const response = await client().models.generateContent({
    model: MODEL,
    contents: [{ role: "user", parts: [{ text: opts.prompt }] }],
    config: {
      systemInstruction: opts.systemPrompt,
      temperature: 0.7,
    },
  });
  return response.text ?? "";
}
