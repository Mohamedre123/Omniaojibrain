import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;

const schema = z.object({
  prompt: z.string().min(3).max(2000),
  refImages: z
    .array(
      z.object({
        mimeType: z.string().max(50),
        data: z.string().max(10 * 1024 * 1024),
      })
    )
    .max(3)
    .optional(),
  brandContext: z.string().max(1000).optional(),
  aspect: z.string().optional(),
});

const MASTER_PHOTO_STYLE = `Ultra-High Resolution 8K Photorealistic Commercial Advertising Photography, razor-sharp focus, soft diffused studio lighting, subtle rim lighting, rich clean colors, luxury brand aesthetic, full-frame camera quality, shallow depth of field, magazine-quality composition.`;

function aspectToSize(aspect?: string): { w: number; h: number } {
  switch (aspect) {
    case "9:16":
    case "9:16-reel":
      return { w: 1024, h: 1792 };
    case "16:9":
      return { w: 1792, h: 1024 };
    case "2:3":
      return { w: 1024, h: 1536 };
    case "fb-cover":
      return { w: 1792, h: 768 };
    default:
      return { w: 1024, h: 1024 };
  }
}

async function fetchWithTimeout(url: string, options: RequestInit & { timeoutMs: number }): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

/** Pollinations.ai (مجاني — يحتاج Referer header) */
async function pollinationsGenerate(prompt: string, aspect?: string, attempt = 0): Promise<{ mimeType: string; data: string } | string> {
  if (attempt >= 3) return "Pollinations: max retries exceeded";
  try {
    const size = aspectToSize(aspect);
    const seed = Math.floor(Math.random() * 1_000_000);
    const trimmed = prompt.slice(0, 1500);
    // model=flux (مجاني) أو turbo (يحتاج token)
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(trimmed)}?width=${size.w}&height=${size.h}&model=flux&nologo=true&seed=${seed}`;

    const res = await fetchWithTimeout(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; OjiBrain/1.0)",
        Referer: "https://ojibrain.vercel.app",
      },
      cache: "no-store",
      timeoutMs: 55_000,
    });

    if (!res.ok) {
      if (res.status === 402 || res.status === 429 || res.status === 503) {
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
          return pollinationsGenerate(prompt, aspect, attempt + 1);
        }
      }
      return `Pollinations: HTTP ${res.status}`;
    }
    const buffer = await res.arrayBuffer();
    if (buffer.byteLength < 1500) return `Pollinations: empty response (${buffer.byteLength}b)`;
    const base64 = Buffer.from(buffer).toString("base64");
    return { mimeType: "image/jpeg", data: base64 };
  } catch (e) {
    if (attempt < 2) {
      await new Promise((r) => setTimeout(r, 2000));
      return pollinationsGenerate(prompt, aspect, attempt + 1);
    }
    return `Pollinations error: ${e instanceof Error ? e.message : "unknown"}`;
  }
}

/** Gemini Flash Image (للـ reference images) */
async function geminiFlashImage(
  ai: GoogleGenAI,
  prompt: string,
  refImages: Array<{ mimeType: string; data: string }>
): Promise<Array<{ mimeType: string; data: string }>> {
  const images: Array<{ mimeType: string; data: string }> = [];
  const models = ["gemini-2.5-flash-image", "gemini-2.0-flash-preview-image-generation"];
  for (const model of models) {
    if (images.length > 0) break;
    try {
      const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];
      for (const img of refImages) parts.push({ inlineData: { mimeType: img.mimeType, data: img.data } });
      parts.push({ text: prompt });
      const response = await ai.models.generateContent({
        model,
        contents: [{ role: "user", parts }],
        config: { responseModalities: ["IMAGE", "TEXT"] } as never,
      });
      const candidates = response.candidates || [];
      for (const candidate of candidates) {
        for (const part of candidate.content?.parts || []) {
          if (part.inlineData?.data) {
            images.push({ mimeType: part.inlineData.mimeType || "image/png", data: part.inlineData.data });
          }
        }
      }
    } catch {
      /* جرّب اللي بعده */
    }
  }
  return images;
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const rl = rateLimit({ key: `imggen:${user.id}`, limit: 10, windowSeconds: 60 });
  if (!rl.allowed) {
    return NextResponse.json({ error: `تجاوزت الحدّ، حاول بعد ${rl.resetIn} ثانية` }, { status: 429 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }
  const body = parsed.data;

  const enhancedPrompt = `${body.prompt}\n\n${MASTER_PHOTO_STYLE}${body.brandContext ? `\n\nBrand: ${body.brandContext}` : ""}`;

  let images: Array<{ mimeType: string; data: string }> = [];
  const errors: string[] = [];

  // 1) Gemini Flash Image أولاً دائماً (مجاني في Free Tier — نموذج nano-banana)
  const key = process.env.GEMINI_API_KEY;
  if (key) {
    try {
      const ai = new GoogleGenAI({ apiKey: key });
      images = await geminiFlashImage(ai, enhancedPrompt, body.refImages ?? []);
      if (images.length === 0) errors.push("Gemini: no image in response");
    } catch (e) {
      errors.push(`Gemini: ${e instanceof Error ? e.message : "failed"}`);
    }
  }

  // 2) Pollinations كـ fallback أخير
  if (images.length === 0) {
    const pollResult = await pollinationsGenerate(enhancedPrompt, body.aspect);
    if (typeof pollResult === "string") {
      errors.push(pollResult);
    } else {
      images.push(pollResult);
    }
  }

  if (images.length === 0) {
    return NextResponse.json(
      { error: `تعذّر التوليد. ${errors.join(" | ").slice(0, 300)}` },
      { status: 503 }
    );
  }

  return NextResponse.json({ images });
}
