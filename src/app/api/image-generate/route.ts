import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
// Vercel Fluid Compute يسمح حتى 300 ثانية — Nano Banana Pro بياخد وقت مع الصور المرجعية
export const maxDuration = 300;

const GL_BASE = "https://generativelanguage.googleapis.com/v1beta";

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
  quality: z.enum(["fast", "high"]).optional().default("fast"),
});

// 🎨 الستايل الأساسي لكل توليد
const MASTER_PHOTO_STYLE = `Ultra-High Resolution 8K Photorealistic Commercial Advertising Photography, razor-sharp focus, soft diffused studio lighting, subtle rim lighting, rich clean colors, luxury brand aesthetic, full-frame camera quality, shallow depth of field, magazine-quality composition.`;

// 🍌 نماذج Gemini فقط
// fast: Nano Banana (flash) أولاً — أسرع بكثير (ثوانٍ) ومناسب للتجربة السريعة
// high: Nano Banana Pro أولاً — أدقّ لكن أبطأ
const MODELS_BY_QUALITY: Record<"fast" | "high", string[]> = {
  fast: ["gemini-2.5-flash-image", "gemini-3-pro-image-preview"],
  high: ["gemini-3-pro-image-preview", "gemini-2.5-flash-image"],
};

function getKeys(): string[] {
  return [process.env.VEO_API_KEY, process.env.GEMINI_API_KEY].filter(
    (k, i, arr): k is string => !!k && k.startsWith("AIza") && arr.indexOf(k) === i
  );
}

function aspectInstruction(aspect?: string): string {
  switch (aspect) {
    case "9:16":
    case "9:16-reel":
      return " Vertical portrait composition, 9:16 aspect ratio.";
    case "16:9":
      return " Wide horizontal composition, 16:9 aspect ratio.";
    case "4:5":
      return " Portrait composition, 4:5 aspect ratio (Instagram portrait).";
    case "2:3":
      return " Tall portrait composition, 2:3 aspect ratio.";
    case "fb-cover":
      return " Ultra-wide banner composition, suitable for Facebook cover.";
    default:
      return " Square composition, 1:1 aspect ratio.";
  }
}

type Part = { text?: string; inlineData?: { mimeType: string; data: string } };

/** استدعاء REST مباشر لـ generateContent مع responseModalities IMAGE */
async function generateImageREST(
  key: string,
  model: string,
  prompt: string,
  refImages: Array<{ mimeType: string; data: string }>,
  timeoutMs: number
): Promise<{ images: Array<{ mimeType: string; data: string }>; error?: string }> {
  const parts: Part[] = [];
  for (const img of refImages) {
    parts.push({ inlineData: { mimeType: img.mimeType, data: img.data } });
  }
  parts.push({ text: prompt });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${GL_BASE}/models/${model}:generateContent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": key,
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts }],
        generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
      }),
      signal: controller.signal,
    });

    const data = await res.json();

    if (!res.ok) {
      const msg = data?.error?.message || `HTTP ${res.status}`;
      return { images: [], error: `${model}: ${String(msg).slice(0, 150)}` };
    }

    const images: Array<{ mimeType: string; data: string }> = [];
    const candidates = data.candidates || [];
    for (const candidate of candidates) {
      for (const part of candidate?.content?.parts || []) {
        if (part.inlineData?.data) {
          images.push({
            mimeType: part.inlineData.mimeType || "image/png",
            data: part.inlineData.data,
          });
        }
      }
    }

    if (images.length === 0) {
      const finishReason = candidates[0]?.finishReason || "unknown";
      return { images: [], error: `${model}: no image (${finishReason})` };
    }

    return { images };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "failed";
    return { images: [], error: `${model}: ${msg.slice(0, 100)}` };
  } finally {
    clearTimeout(timer);
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

  const keys = getKeys();
  if (keys.length === 0) {
    return NextResponse.json({ error: "مفتاح Gemini غير مضبوط في الخادم" }, { status: 500 });
  }

  // 🔤 لو الطلب فيه نص مكتوب داخل الصورة، استخدم Pro (الأدقّ في النص خصوصاً العربي)
  const wantsText =
    /["“”«»][^"“”«»]{1,80}["“”«»]/.test(body.prompt) ||
    /(اكتب|مكتوب|عبار[ةه]|نصّ?|جمل[ةه]|كلم[ةه]|شعار|عنوان|بخط|لافت[ةه]|تايبوغرافي|typography|text\s|caption|headline|slogan)/i.test(body.prompt);

  const effectiveQuality: "fast" | "high" = wantsText ? "high" : body.quality;

  const textNote = wantsText
    ? "\n\nCRITICAL TEXT RULE: Render any requested text EXACTLY as written, spelled correctly. For Arabic text, use proper right-to-left direction and correct CONNECTED letter forms (not isolated/broken glyphs). The text must be clean, legible, and accurate."
    : "";

  const enhancedPrompt = `${body.prompt}\n\n${MASTER_PHOTO_STYLE}${aspectInstruction(body.aspect)}${body.brandContext ? `\n\nBrand: ${body.brandContext}` : ""}${textNote}\n\nIMPORTANT: You MUST generate and output an actual IMAGE. Do not respond with text only.`;

  const models = MODELS_BY_QUALITY[effectiveQuality];
  // مهلة أقصر للوضع السريع (flash يردّ في ثوانٍ) — يقلّل فشل الاتصال على شبكات الموبايل
  const timeoutMs = effectiveQuality === "fast" ? 90_000 : 230_000;

  const errors: string[] = [];

  for (const key of keys) {
    for (const model of models) {
      const result = await generateImageREST(key, model, enhancedPrompt, body.refImages ?? [], timeoutMs);
      if (result.images.length > 0) {
        return NextResponse.json({ images: result.images, model });
      }
      if (result.error) errors.push(result.error);
    }
  }

  return NextResponse.json(
    { error: `تعذّر التوليد. ${errors.slice(0, 3).join(" | ")}` },
    { status: 503 }
  );
}
