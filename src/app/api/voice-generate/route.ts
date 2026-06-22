import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;

const schema = z.object({
  text: z.string().min(1).max(3000),
  provider: z.enum(["elevenlabs", "gemini"]).optional().default("elevenlabs"),
  voiceId: z.string().optional(),
  stability: z.number().min(0).max(1).optional(),
  similarity: z.number().min(0).max(1).optional(),
  style: z.number().min(0).max(1).optional(),
  speakerBoost: z.boolean().optional(),
});

const GL_BASE = "https://generativelanguage.googleapis.com/v1beta";

function geminiKey(): string | null {
  for (const k of [process.env.GEMINI_API_KEY, process.env.VEO_API_KEY]) {
    if (k && k.startsWith("AIza")) return k;
  }
  return null;
}

/** يلفّ PCM خام (s16le mono) في رأس WAV عشان يشتغل في المتصفح */
function pcmToWav(pcmBase64: string, sampleRate: number): string {
  const pcm = Buffer.from(pcmBase64, "base64");
  const numChannels = 1, bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]).toString("base64");
}

async function generateGeminiTTS(text: string, voiceName: string): Promise<{ ok: true; audioBase64: string; mimeType: string } | { ok: false; error: string }> {
  const key = geminiKey();
  if (!key) return { ok: false, error: "مفتاح Gemini غير مضبوط في الخادم" };

  const models = ["gemini-2.5-flash-preview-tts", "gemini-2.5-pro-preview-tts"];
  let lastErr = "";
  for (const model of models) {
    try {
      const res = await fetch(`${GL_BASE}/models/${model}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({
          contents: [{ parts: [{ text }] }],
          generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } },
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) { lastErr = data?.error?.message || `HTTP ${res.status}`; continue; }
      const part = data?.candidates?.[0]?.content?.parts?.find((p: { inlineData?: { data?: string } }) => p?.inlineData?.data);
      const b64 = part?.inlineData?.data as string | undefined;
      const mime = (part?.inlineData?.mimeType as string | undefined) || "audio/L16;rate=24000";
      if (!b64) { lastErr = `${model}: لا يوجد صوت`; continue; }
      const rateMatch = mime.match(/rate=(\d+)/);
      const sampleRate = rateMatch ? parseInt(rateMatch[1], 10) : 24000;
      return { ok: true, audioBase64: pcmToWav(b64, sampleRate), mimeType: "audio/wav" };
    } catch (e) {
      lastErr = e instanceof Error ? e.message : "failed";
    }
  }
  return { ok: false, error: `Gemini TTS: ${lastErr.slice(0, 200)}` };
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const rl = rateLimit({ key: `tts:${user.id}`, limit: 10, windowSeconds: 60 });
  if (!rl.allowed) return NextResponse.json({ error: "تجاوزت الحدّ" }, { status: 429 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  // ===== مسار Gemini TTS (أصوات Google AI Studio) =====
  if (parsed.data.provider === "gemini") {
    const result = await generateGeminiTTS(parsed.data.text, parsed.data.voiceId || "Kore");
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ audioBase64: result.audioBase64, mimeType: result.mimeType });
  }

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
