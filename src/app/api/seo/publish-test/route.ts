import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { publishArticle, type SeoPublishConfig } from "@/lib/seo-publish";

export const runtime = "nodejs";
export const maxDuration = 30;

const schema = z.object({
  platform: z.enum(["wordpress", "webhook"]),
  siteUrl: z.string().max(300).optional().default(""),
  username: z.string().max(200).optional().default(""),
  appPassword: z.string().max(400).optional().default(""),
  webhookUrl: z.string().max(500).optional().default(""),
  authHeader: z.string().max(500).optional().default(""),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });

  // اختبار غير مؤذٍ — WordPress كمسودّة، Webhook كرسالة تجريبية
  const cfg: SeoPublishConfig = { ...parsed.data, status: "draft" };
  const article = {
    title: "اختبار Oji — تأكيد الربط ✅",
    markdown: "## 📝 المقال\nدي رسالة اختبار من Oji Brain للتأكد إن ربط النشر شغّال. تقدر تمسحها.",
  };

  try {
    const r = await publishArticle(cfg, article);
    return NextResponse.json({ ok: true, url: r.url });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "فشل الاختبار" }, { status: 400 });
  }
}
