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
});

// نماذج التوليد بترتيب الأولوية — لو واحد فشل جرّب اللي بعده
const IMAGE_MODELS = [
  "gemini-2.5-flash-image",
  "gemini-2.0-flash-preview-image-generation",
  "imagen-4.0-generate-001",
  "imagen-3.0-generate-002",
];

async function trySleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
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

  const key = process.env.GEMINI_API_KEY;
  if (!key) return NextResponse.json({ error: "إعدادات الخادم ناقصة" }, { status: 500 });

  const ai = new GoogleGenAI({ apiKey: key });

  const fullPrompt = body.brandContext
    ? `${body.prompt}\n\n[Brand context: ${body.brandContext}]`
    : body.prompt;

  const images: Array<{ mimeType: string; data: string }> = [];
  let textOutput = "";
  let lastError = "";

  // جرّب كل نموذج بالترتيب
  for (const model of IMAGE_MODELS) {
    if (images.length > 0) break;

    try {
      // نموذج Imagen يستخدم API مختلف
      if (model.startsWith("imagen-")) {
        try {
          const imagenResp = await ai.models.generateImages({
            model,
            prompt: fullPrompt,
            config: { numberOfImages: 1, aspectRatio: "1:1" },
          });
          const gen = imagenResp.generatedImages || [];
          for (const g of gen) {
            if (g.image?.imageBytes) {
              images.push({ mimeType: "image/png", data: g.image.imageBytes });
            }
          }
        } catch (e) {
          lastError = e instanceof Error ? e.message : "Imagen failed";
        }
      } else {
        // نماذج Gemini Flash Image تستخدم generateContent
        const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];
        if (body.refImages && body.refImages.length > 0) {
          for (const img of body.refImages) {
            parts.push({ inlineData: { mimeType: img.mimeType, data: img.data } });
          }
        }
        parts.push({ text: fullPrompt });

        // محاولات متعدّدة عند الـ 503
        let attempts = 0;
        let success = false;
        while (attempts < 3 && !success) {
          try {
            const response = await ai.models.generateContent({
              model,
              contents: [{ role: "user", parts }],
              config: {
                responseModalities: ["IMAGE", "TEXT"],
              } as never,
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
            success = true;
          } catch (e) {
            const msg = e instanceof Error ? e.message : "";
            lastError = msg;
            if (msg.includes("503") || msg.includes("UNAVAILABLE") || msg.includes("overloaded")) {
              attempts++;
              await trySleep(1000 * attempts);
            } else {
              break; // خطأ غير قابل للإعادة
            }
          }
        }
      }
    } catch (e) {
      lastError = e instanceof Error ? e.message : "Unknown";
    }
  }

  if (images.length === 0) {
    return NextResponse.json(
      {
        error: `تعذّر توليدُ الصورة. ${lastError ? `السبب: ${lastError.slice(0, 200)}` : ""} ربما يحتاج حسابك تفعيل ميزة توليد الصور في Google AI Studio (Paid Tier).`,
        textHint: textOutput || undefined,
      },
      { status: 503 }
    );
  }

  return NextResponse.json({ images, text: textOutput });
}
