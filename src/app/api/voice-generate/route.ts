import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;

const schema = z.object({
  text: z.string().min(1).max(3000),
  voiceId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const rl = rateLimit({ key: `tts:${user.id}`, limit: 5, windowSeconds: 60 });
  if (!rl.allowed) return NextResponse.json({ error: "تجاوزت الحدّ" }, { status: 429 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error: "ميزة Voice-over باستخدام ElevenLabs غير مفعّلة. للتفعيل، يلزم إضافة ELEVENLABS_API_KEY في إعدادات الخادم. كبديل، يمكنك استخدام صوت المتصفّح المجاني من واجهة الموقع.",
      },
      { status: 503 }
    );
  }

  // أصوات عربية شائعة من ElevenLabs (Multilingual v2 يدعم العربي)
  // 21m00Tcm4TlvDq8ikWAM = Rachel (Female - English/Multilingual)
  // EXAVITQu4vr4xnSDxMaL = Bella
  // ErXwobaYiN019PkySvjV = Antoni (Male)
  const voiceId = parsed.data.voiceId || "EXAVITQu4vr4xnSDxMaL";

  try {
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
      },
      body: JSON.stringify({
        text: parsed.data.text,
        model_id: "eleven_multilingual_v2",
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ error: `ElevenLabs error: ${errText.slice(0, 200)}` }, { status: 500 });
    }

    const buffer = await res.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    return NextResponse.json({ audioBase64: base64, mimeType: "audio/mpeg" });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "حدثت مشكلة" }, { status: 500 });
  }
}
