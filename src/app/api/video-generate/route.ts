import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;

const GL_BASE = "https://generativelanguage.googleapis.com/v1beta";

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
  // صورة النهاية (End frame) — مدعومة في Veo 3.1
  endImage: z
    .object({
      mimeType: z.string().max(50),
      data: z.string().max(10 * 1024 * 1024),
    })
    .optional(),
});

// 🎬 Veo 3.1 أولاً ثم 3.0 (المُختبَر) كـ fallback
const VIDEO_MODELS: Record<"fast" | "quality", string[]> = {
  fast: ["veo-3.1-fast-generate-preview", "veo-3.0-fast-generate-001"],
  quality: ["veo-3.1-generate-preview", "veo-3.0-generate-001"],
};

function getKey(): string | null {
  const candidates = [process.env.VEO_API_KEY, process.env.GEMINI_API_KEY];
  for (const k of candidates) {
    if (k && k.startsWith("AIza")) return k;
  }
  return null;
}

/** POST: يبدأ توليد الفيديو عبر REST ويرجع اسم العملية */
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
  if (!key) return NextResponse.json({ error: "مفتاح Gemini غير مضبوط في الخادم" }, { status: 500 });

  const errors: string[] = [];

  for (const model of VIDEO_MODELS[body.model]) {
    try {
      // instance يُبنى لكل موديل — صورة النهاية (lastFrame) مدعومة في Veo 3.1 فقط
      const instance: Record<string, unknown> = { prompt: body.prompt };
      if (body.refImage) {
        instance.image = {
          bytesBase64Encoded: body.refImage.data,
          mimeType: body.refImage.mimeType,
        };
      }
      if (body.endImage && model.includes("3.1")) {
        instance.lastFrame = {
          bytesBase64Encoded: body.endImage.data,
          mimeType: body.endImage.mimeType,
        };
      }

      const res = await fetch(`${GL_BASE}/models/${model}:predictLongRunning`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": key,
        },
        body: JSON.stringify({
          instances: [instance],
          parameters: { aspectRatio: body.aspect },
        }),
      });

      const data = await res.json();

      if (res.ok && data.name) {
        return NextResponse.json({ operationName: data.name, model });
      }

      const msg = data?.error?.message || `HTTP ${res.status}`;
      errors.push(`${model}: ${String(msg).slice(0, 120)}`);
    } catch (e) {
      errors.push(`${model}: ${e instanceof Error ? e.message.slice(0, 100) : "failed"}`);
    }
  }

  return NextResponse.json(
    { error: `Veo: ${errors.join(" | ").slice(0, 350)}` },
    { status: 500 }
  );
}

/** GET ?op=NAME → حالة العملية | GET ?download=URI → proxy للفيديو */
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const key = getKey();
  if (!key) return NextResponse.json({ error: "مفتاح Gemini غير مضبوط" }, { status: 500 });

  const { searchParams } = new URL(req.url);
  const opName = searchParams.get("op");
  const downloadUri = searchParams.get("download");

  // ===== وضع التنزيل (proxy — المفتاح محمي في السيرفر) =====
  if (downloadUri) {
    if (!downloadUri.startsWith("https://generativelanguage.googleapis.com/")) {
      return NextResponse.json({ error: "رابط غير مسموح" }, { status: 400 });
    }
    try {
      const videoRes = await fetch(downloadUri, {
        headers: { "x-goog-api-key": key },
        redirect: "follow",
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

  // ===== وضع الـ polling (REST مباشر — بدون SDK نهائياً) =====
  if (!opName) return NextResponse.json({ error: "op مطلوب" }, { status: 400 });

  if (!/^models\/[\w.-]+\/operations\/[\w-]+$/.test(opName)) {
    return NextResponse.json({ error: "اسم عملية غير صالح" }, { status: 400 });
  }

  try {
    const res = await fetch(`${GL_BASE}/${opName}`, {
      headers: { "x-goog-api-key": key },
      cache: "no-store",
    });
    const data = await res.json();

    if (!res.ok) {
      const msg = data?.error?.message || `HTTP ${res.status}`;
      return NextResponse.json({ error: String(msg).slice(0, 300) }, { status: 500 });
    }

    if (!data.done) {
      return NextResponse.json({ done: false });
    }

    if (data.error) {
      return NextResponse.json({
        done: true,
        error: String(data.error.message || "فشل التوليد").slice(0, 300),
      });
    }

    // استخراج URI من كل صيغ الردود المحتملة
    const resp = data.response || {};
    const uri =
      resp?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri ||
      resp?.generatedVideos?.[0]?.video?.uri ||
      resp?.predictions?.[0]?.video?.uri ||
      resp?.videos?.[0]?.uri ||
      null;

    if (!uri) {
      return NextResponse.json({
        done: true,
        error: "اكتمل التوليد لكن بدون فيديو (ربما حُظر المحتوى بسبب سياسات Google)",
      });
    }

    return NextResponse.json({ done: true, videoUri: uri });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "حدثت مشكلة";
    return NextResponse.json({ error: msg.slice(0, 300) }, { status: 500 });
  }
}
