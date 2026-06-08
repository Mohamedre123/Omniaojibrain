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

// 🎨 الستايل الأساسي اللي يتضاف لكل توليد صورة لضمان جودة احترافية
const MASTER_PHOTO_STYLE = `Ultra-High Resolution 8K Photorealistic Commercial Advertising Photography, razor-sharp focus, zero artifacts, true-to-life textures and realistic details, soft diffused studio lighting that prevents harsh shadows, subtle rim lighting / edge glow from the back for 3D depth, rich and clean colors in luxury brand aesthetic, full-frame camera quality with shallow depth of field, magazine-quality composition, professional commercial photography.`;

// نماذج التوليد بترتيب الأولوية
const GEMINI_IMAGE_MODELS = [
  "gemini-2.5-flash-image",
  "gemini-2.0-flash-preview-image-generation",
];

const IMAGEN_MODELS = [
  "imagen-4.0-generate-001",
  "imagen-4.0-fast-generate-001",
  "imagen-3.0-generate-002",
];

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

async function trySleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Fallback مجاني تماماً عن طريق Pollinations.ai */
async function pollinationsGenerate(prompt: string, aspect?: string): Promise<{ mimeType: string; data: string } | null> {
  try {
    const size = aspectToSize(aspect);
    const seed = Math.floor(Math.random() * 1_000_000);
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${size.w}&height=${size.h}&model=flux&nologo=true&seed=${seed}&enhance=true`;
    const res = await fetch(url, {
      headers: { "User-Agent": "OjiBrain/1.0" },
      signal: AbortSignal.timeout(50_000),
    });
    if (!res.ok) return null;
    const buffer = await res.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    return { mimeType: "image/jpeg", data: base64 };
  } catch {
    return null;
  }
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

  // بناء البرومبت النهائي مع الستايل الأساسي
  const enhancedPrompt = `${body.prompt}\n\n${MASTER_PHOTO_STYLE}${body.brandContext ? `\n\nBrand context: ${body.brandContext}` : ""}`;

  const images: Array<{ mimeType: string; data: string }> = [];
  let textOutput = "";
  let lastError = "";

  const key = process.env.GEMINI_API_KEY;
  const hasRefImages = body.refImages && body.refImages.length > 0;

  if (key) {
    const ai = new GoogleGenAI({ apiKey: key });

    // جرّب Gemini Flash Image أولاً (يدعم reference images)
    for (const model of GEMINI_IMAGE_MODELS) {
      if (images.length > 0) break;
      try {
        const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];
        if (hasRefImages) {
          for (const img of body.refImages!) {
            parts.push({ inlineData: { mimeType: img.mimeType, data: img.data } });
          }
        }
        parts.push({ text: enhancedPrompt });

        let attempts = 0;
        while (attempts < 2 && images.length === 0) {
          try {
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
                if (part.text) textOutput += part.text;
              }
            }
            break;
          } catch (e) {
            const msg = e instanceof Error ? e.message : "";
            lastError = msg;
            attempts++;
            if (!msg.includes("503") && !msg.includes("UNAVAILABLE") && !msg.includes("overloaded")) break;
            await trySleep(1000);
          }
        }
      } catch (e) {
        lastError = e instanceof Error ? e.message : "";
      }
    }

    // جرّب Imagen لو Gemini Flash فشل وما فيش reference images
    if (images.length === 0 && !hasRefImages) {
      for (const model of IMAGEN_MODELS) {
        if (images.length > 0) break;
        try {
          const imagenResp = await ai.models.generateImages({
            model,
            prompt: enhancedPrompt,
            config: { numberOfImages: 1, aspectRatio: body.aspect === "9:16" ? "9:16" : body.aspect === "16:9" ? "16:9" : "1:1" } as never,
          });
          const gen = imagenResp.generatedImages || [];
          for (const g of gen) {
            if (g.image?.imageBytes) {
              images.push({ mimeType: "image/png", data: g.image.imageBytes });
            }
          }
        } catch (e) {
          lastError = e instanceof Error ? e.message : "";
        }
      }
    }
  }

  // 🆘 Fallback مجاني عبر Pollinations.ai (لا يحتاج API key)
  if (images.length === 0) {
    const pollImage = await pollinationsGenerate(enhancedPrompt, body.aspect);
    if (pollImage) {
      images.push(pollImage);
      textOutput = "تمّ التوليد عبر Pollinations.ai (مجاني). للحصول على جودة أعلى، فعّل توليد الصور المدفوع في Google AI Studio.";
    }
  }

  if (images.length === 0) {
    return NextResponse.json(
      {
        error: `تعذّر توليد الصورة. ${lastError ? lastError.slice(0, 150) : "كلّ الخدمات فشلت."}`,
        textHint: textOutput || undefined,
      },
      { status: 503 }
    );
  }

  return NextResponse.json({ images, text: textOutput });
}
