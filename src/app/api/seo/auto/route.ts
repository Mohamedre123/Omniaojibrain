import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const publishSchema = z.object({
  platform: z.enum(["none", "wordpress", "webhook"]).optional().default("none"),
  siteUrl: z.string().max(300).optional().default(""),
  username: z.string().max(200).optional().default(""),
  appPassword: z.string().max(400).optional().default(""),
  status: z.enum(["publish", "draft"]).optional().default("publish"),
  webhookUrl: z.string().max(500).optional().default(""),
  authHeader: z.string().max(500).optional().default(""),
}).optional();

const schema = z.object({
  project_id: z.string().uuid(),
  enabled: z.boolean(),
  keywords: z.array(z.string().max(120)).max(30).optional().default([]),
  publish: publishSchema,
});

// قائمة اشتراكات الأتمتة للمستخدم
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("oji_connectors")
    .select("config, enabled")
    .eq("user_id", user.id)
    .eq("service", "seo:auto");
  if (error) {
    if (/relation .* does not exist|oji_connectors/i.test(error.message)) {
      return NextResponse.json({ items: [], needs_table: true });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ items: data || [] });
}

// تفعيل/تعطيل الأتمتة اليومية لمشروع
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });
  const { project_id, enabled, keywords, publish } = parsed.data;

  // تأكّد إن المشروع بتاع المستخدم
  const { data: proj } = await supabase
    .from("projects")
    .select("id")
    .eq("id", project_id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!proj) return NextResponse.json({ error: "مشروع غير موجود" }, { status: 404 });

  const secret = `seo-auto:${project_id}`;
  // اتصال واحد لكل مشروع — نحذف القديم ونضيف الجديد
  await supabase.from("oji_connectors").delete().eq("user_id", user.id).eq("secret", secret);

  const { error } = await supabase.from("oji_connectors").insert({
    user_id: user.id,
    service: "seo:auto",
    secret,
    config: {
      project_id,
      keywords: keywords.filter((k) => k.trim()),
      publish: publish && publish.platform !== "none" ? publish : undefined,
    },
    enabled,
  });
  if (error) {
    if (/relation .* does not exist|oji_connectors/i.test(error.message)) {
      return NextResponse.json({ error: "needs_table" }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
