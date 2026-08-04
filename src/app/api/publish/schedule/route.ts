import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const schema = z.object({
  platform: z.enum(["facebook", "instagram", "telegram", "linkedin"]),
  text: z.string().max(6000).optional().default(""),
  image_paths: z.array(z.string().max(400)).max(10).optional().default([]),
  publish_at: z.string().datetime(),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "بيانات ناقصة أو وقت غير صحيح" }, { status: 400 });
  const { platform, text, image_paths, publish_at } = parsed.data;
  if (!text.trim() && image_paths.length === 0) return NextResponse.json({ error: "اكتب نصّ أو ارفع صورة" }, { status: 400 });
  if (new Date(publish_at).getTime() < Date.now() - 60_000) return NextResponse.json({ error: "اختر وقتاً في المستقبل" }, { status: 400 });

  const { error } = await supabase.from("scheduled_posts").insert({
    user_id: user.id,
    platform,
    text,
    image_paths,
    publish_at,
    status: "pending",
  });
  if (error) {
    if (/relation .* does not exist|scheduled_posts/i.test(error.message)) return NextResponse.json({ error: "needs_table" }, { status: 400 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
