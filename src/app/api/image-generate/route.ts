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

  // بناء الـ prompt مع سياق العلامة
  const fullPrompt = body.brandContext
    ? `${body.prompt}\n\n[Brand context: ${body.brandContext}]`
    : body.prompt;

  try {
    // استخدم Gemini 2.5 Flash Image لتوليد/تعديل الصور
    const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];
    if (body.refImages && body.refImages.length > 0) {
      for (const img of body.refImages) {
        parts.push({ inlineData: { mimeType: img.mimeType, data: img.data } });
      }
    }
    parts.push({ text: fullPrompt });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image-preview",
      contents: [{ role: "user", parts }],
    });

    // استخرج الصور المولّدة من الرد
    const images: Array<{ mimeType: string; data: string }> = [];
    let textOutput = "";

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

    if (images.length === 0) {
      // محاولة fallback - استخدم نموذج Imagen المخصّص
      try {
        const imagenResp = await ai.models.generateImages({
          model: "imagen-3.0-generate-002",
          prompt: fullPrompt,
          config: { numberOfImages: 1, aspectRatio: "1:1" },
        });
        const gen = imagenResp.generatedImages || [];
        for (const g of gen) {
          if (g.image?.imageBytes) {
            images.push({
              mimeType: "image/png",
              data: g.image.imageBytes,
            });
          }
        }
      } catch {
        // ignore
      }
    }

    if (images.length === 0) {
      return NextResponse.json(
        {
          error:
            "نموذج توليد الصور غير متاح حالياً. ربما يحتاج حسابك تفعيل ميزة الصور في Google AI Studio.",
          textHint: textOutput || undefined,
        },
        { status: 503 }
      );
    }

    return NextResponse.json({ images, text: textOutput });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "حدثت مشكلة";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
