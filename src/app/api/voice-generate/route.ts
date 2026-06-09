import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;

const schema = z.object({
  text: z.string().min(1).max(3000),
  voiceId: z.string().optional(),
  stability: z.number().min(0).max(1).optional(),
  similarity: z.number().min(0).max(1).optional(),
  style: z.number().min(0).max(1).optional(),
  speakerBoost: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const rl = rateLimit({ key: `tts:${user.id}`, limit: 10, windowSeconds: 60 });
  if (!rl.allowed) return NextResponse.json({ error: "تجاوزت الحدّ" }, { status: 429 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ELEVENLABS_API_KEY مفقود. تحقق من إعدادات Vercel." }, { status: 503 });
  }

  const voiceId = parsed.data.voiceId || "EXAVITQu4vr4xnSDxMaL"; // Bella

  try {
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text: parsed.data.text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: parsed.data.stability ?? 0.5,
          similarity_boost: parsed.data.similarity ?? 0.75,
          style: parsed.data.style ?? 0,
          use_speaker_boost: parsed.data.speakerBoost ?? true,
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      let parsedErr = errText;
      try {
        const j = JSON.parse(errText);
        parsedErr = j.detail?.message || j.detail || j.error || errText;
      } catch {}
      return NextResponse.json({ error: `ElevenLabs: ${String(parsedErr).slice(0, 200)}` }, { status: 500 });
    }

    const buffer = await res.arrayBuffer();
    if (buffer.byteLength < 200) {
      return NextResponse.json({ error: "ElevenLabs رجع response فارغ" }, { status: 500 });
    }
    const base64 = Buffer.from(buffer).toString("base64");
    return NextResponse.json({ audioBase64: base64, mimeType: "audio/mpeg" });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "حدثت مشكلة" }, { status: 500 });
  }
}
