import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;

const startSchema = z.object({
  prompt: z.string().min(3).max(2000),
  aspect: z.enum(["16:9", "9:16"]).optional().default("16:9"),
  model: z.enum(["fast", "quality"]).optional().default("fast"),
  refImage: z
    .object({
      mimeType: z.string().max(50),
      data: z.string().max(10 * 1024 * 1024),
    })
    .optional(),
});

function getKey(): string | null {
  return process.env.VEO_API_KEY || process.env.GEMINI_API_KEY || null;
}

/** POST: يبدأ توليد الفيديو ويرجع اسم العملية */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const rl = rateLimit({ key: `video:${user.id}`, limit: 4, windowSeconds: 300 });
  if (!rl.allowed) {
    return NextResponse.json({ error: `تجاوزت الحدّ، حاول بعد ${rl.resetIn} ثانية` }, { status: 429 });
  }

  const parsed = startSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }
  const body = parsed.data;

  const key = getKey();
  if (!key) return NextResponse.json({ error: "مفتاح Veo غير مضبوط" }, { status: 500 });

  const ai = new GoogleGenAI({ apiKey: key });
  const model = body.model === "quality" ? "veo-3.0-generate-001" : "veo-3.0-fast-generate-001";

  try {
    const operation = await ai.models.generateVideos({
      model,
      prompt: body.prompt,
      ...(body.refImage
        ? { image: { imageBytes: body.refImage.data, mimeType: body.refImage.mimeType } }
        : {}),
      config: {
        aspectRatio: body.aspect,
      } as never,
    });

    return NextResponse.json({ operationName: operation.name });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "حدثت مشكلة";
    return NextResponse.json({ error: `Veo: ${msg.slice(0, 300)}` }, { status: 500 });
  }
}

/** GET ?op=NAME → حالة العملية | GET ?download=URI → proxy لتنزيل الفيديو */
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const key = getKey();
  if (!key) return NextResponse.json({ error: "مفتاح Veo غير مضبوط" }, { status: 500 });

  const { searchParams } = new URL(req.url);
  const opName = searchParams.get("op");
  const downloadUri = searchParams.get("download");

  // وضع التنزيل: proxy للفيديو مع المفتاح (المفتاح لا يصل للعميل أبداً)
  if (downloadUri) {
    if (!downloadUri.startsWith("https://generativelanguage.googleapis.com/")) {
      return NextResponse.json({ error: "رابط غير مسموح" }, { status: 400 });
    }
    try {
      const videoRes = await fetch(downloadUri, {
        headers: { "x-goog-api-key": key },
      });
      if (!videoRes.ok) {
        return NextResponse.json({ error: `تنزيل الفيديو فشل: ${videoRes.status}` }, { status: 502 });
      }
      return new Response(videoRes.body, {
        headers: {
          "Content-Type": videoRes.headers.get("Content-Type") || "video/mp4",
          "Cache-Control": "private, max-age=3600",
        },
      });
    } catch (e) {
      return NextResponse.json({ error: e instanceof Error ? e.message : "فشل التنزيل" }, { status: 502 });
    }
  }

  // وضع الـ polling
  if (!opName) return NextResponse.json({ error: "op مطلوب" }, { status: 400 });

  const ai = new GoogleGenAI({ apiKey: key });

  try {
    const operation = await ai.operations.getVideosOperation({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      operation: { name: opName } as any,
    });

    if (!operation.done) {
      return NextResponse.json({ done: false });
    }

    if (operation.error) {
      return NextResponse.json({
        done: true,
        error: String(operation.error.message || "فشل التوليد").slice(0, 300),
      });
    }

    const video = operation.response?.generatedVideos?.[0]?.video;
    const uri = video?.uri;
    if (!uri) {
      return NextResponse.json({ done: true, error: "اكتمل التوليد لكن بدون فيديو (ربما حُظر المحتوى)" });
    }

    return NextResponse.json({ done: true, videoUri: uri });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "حدثت مشكلة";
    return NextResponse.json({ error: msg.slice(0, 300) }, { status: 500 });
  }
}
