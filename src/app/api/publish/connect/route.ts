import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const schema = z.object({
  platform: z.enum(["facebook", "instagram", "telegram", "linkedin"]),
  token: z.string().min(10).max(4000),
  target: z.string().max(200).optional().default(""), // page_id / ig_user_id / channel / author_urn
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });
  const { platform, token, target } = parsed.data;

  const service = `publish:${platform}`;
  // نحذف القديم لنفس المنصّة ثم نضيف الجديد (اتصال واحد لكل منصّة)
  await supabase.from("oji_connectors").delete().eq("user_id", user.id).eq("service", service);

  const { error } = await supabase.from("oji_connectors").insert({
    user_id: user.id,
    service,
    secret: `${platform}-${user.id}-${Date.now()}`,
    config: { token, target },
    enabled: true,
  });
  if (error) {
    if (/relation .* does not exist|oji_connectors/i.test(error.message)) {
      return NextResponse.json({ error: "needs_table" }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
