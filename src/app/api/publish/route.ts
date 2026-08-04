import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import { publishToPlatform, type PublishConfig } from "@/lib/publish";

export const runtime = "nodejs";
export const maxDuration = 60;

const schema = z.object({
  platform: z.enum(["facebook", "instagram", "telegram", "linkedin"]),
  text: z.string().max(6000).optional().default(""),
  images: z.array(z.string().url()).max(10).optional().default([]),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const rl = rateLimit({ key: `publish:${user.id}`, limit: 20, windowSeconds: 60 });
  if (!rl.allowed) return NextResponse.json({ error: "تجاوزت الحدّ، حاول بعد قليل" }, { status: 429 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });
  const { platform, text, images } = parsed.data;
  if (!text.trim() && images.length === 0) return NextResponse.json({ error: "اكتب نصّ أو ارفع صورة" }, { status: 400 });

  const { data: conn } = await supabase
    .from("oji_connectors")
    .select("config")
    .eq("user_id", user.id)
    .eq("service", `publish:${platform}`)
    .maybeSingle();
  if (!conn) return NextResponse.json({ error: "المنصّة دي مش مربوطة — اربطها بالـ API الأول" }, { status: 400 });

  try {
    await publishToPlatform(platform, (conn.config || {}) as PublishConfig, text, images);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "فشل النشر" }, { status: 502 });
  }
}
