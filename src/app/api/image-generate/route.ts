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

// 🎨 الستايل الأساسي اللي يتضاف لكل توليد صورة
const MASTER_PHOTO_STYLE = `Ultra-High Resolution 8K Photorealistic Commercial Advertising Photography, razor-sharp focus, zero artifacts, true-to-life textures and realistic details, soft diffused studio lighting that prevents harsh shadows, subtle rim lighting / edge glow from the back for 3D depth, rich and clean colors in luxury brand aesthetic, full-frame camera quality with shallow depth of field, magazine-quality composition, professional commercial photography.`;

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

/** Pollinations.ai — مجاني بدون API key، شغّال 100% */
async function pollinationsGenerate(prompt: string, aspect?: string): Promise<{ mimeType: string; data: string } | null> {
  try {
    const size = aspectToSize(aspect);
    const seed = Math.floor(Math.random() * 1_000_000);
    const trimmed = prompt.slice(0, 1500);
    // model=turbo مجاني، model=flux مدفوع
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(trimmed)}?width=${size.w}&height=${size.h}&model=turbo&nologo=true&seed=${seed}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 55_000);

    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 OjiBrain/1.0" },
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timer);

    if (!res.ok) return null;
    const buffer = await res.arrayBuffer();
    if (buffer.byteLength < 1000) return null;
    const base64 = Buffer.from(buffer).toString("base64");
    return { mimeType: "image/jpeg", data: base64 };
  } catch {
    return null;
  }
}

/** Gemini Flash Image (للـ reference images فقط) */
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
        const cParts = candidate.content?.parts || [];
        for (const part of cParts) {
          if (part.inlineData?.data) {
            images.push({
              mimeType: part.inlineData.mimeType || "image/png",
              data: part.inlineData.data,
            });
          }
        }
      }
    } catch {
      // جرّب اللي بعده
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

  const hasRefImages = !!(body.refImages && body.refImages.length > 0);
  let images: Array<{ mimeType: string; data: string }> = [];

  // الاستراتيجية الجديدة:
  // - مع reference images: جرّب Gemini أولاً (هو اللي يفهم الصور)، fallback لـ Pollinations
  // - بدون reference images: Pollinations مباشرة (مضمون يشتغل)

  if (hasRefImages) {
    const key = process.env.GEMINI_API_KEY;
    if (key) {
      try {
        const ai = new GoogleGenAI({ apiKey: key });
        images = await geminiFlashImage(ai, enhancedPrompt, body.refImages!);
      } catch {
        // فشل، هنكمّل لـ Pollinations
      }
    }
  }

  // Pollinations: الاستراتيجية الأساسية (شغّال 100%)
  if (images.length === 0) {
    const pollImage = await pollinationsGenerate(enhancedPrompt, body.aspect);
    if (pollImage) images.push(pollImage);
  }

  if (images.length === 0) {
    return NextResponse.json(
      { error: "تعذّر توليد الصورة. جرّب وصفاً أبسط أو حاول بعد دقيقة." },
      { status: 503 }
    );
  }

  return NextResponse.json({ images });
}
