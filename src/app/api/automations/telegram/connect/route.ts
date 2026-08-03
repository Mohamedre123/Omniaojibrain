import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

const schema = z.object({
  token: z.string().min(20).max(100),
  project_id: z.string().uuid().optional(),
  persona: z.string().max(2000).optional().default(""),
});

function siteUrl(req: NextRequest): string {
  const env = process.env.NEXT_PUBLIC_SITE_URL;
  if (env && env.startsWith("http") && !env.includes("localhost")) return env.replace(/\/$/, "");
  // fallback لعنوان الطلب (للنشر)
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") || "https";
  return host ? `${proto}://${host}` : (env || "").replace(/\/$/, "");
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });
  const { token, project_id, persona } = parsed.data;

  // 1) تحقّق من صحّة التوكن
  let botUsername = "";
  try {
    const me = await fetch(`https://api.telegram.org/bot${token}/getMe`).then((r) => r.json());
    if (!me.ok) return NextResponse.json({ error: "توكن البوت غير صحيح — راجعه من @BotFather" }, { status: 400 });
    botUsername = me.result?.username || "";
  } catch {
    return NextResponse.json({ error: "تعذّر التحقّق من التوكن" }, { status: 502 });
  }

  const secret = randomUUID().replace(/-/g, "");
  const base = siteUrl(req);
  if (!base.startsWith("http")) return NextResponse.json({ error: "عنوان الموقع غير مضبوط (NEXT_PUBLIC_SITE_URL)" }, { status: 500 });
  const webhookUrl = `${base}/api/automations/telegram/${secret}`;

  // 2) خزّن الموصّل
  const { error } = await supabase.from("oji_connectors").insert({
    user_id: user.id,
    service: "telegram",
    secret,
    config: { token, project_id: project_id || null, persona: persona || "", bot_username: botUsername },
    enabled: true,
  });
  if (error) {
    if (/relation .* does not exist|oji_connectors/i.test(error.message)) {
      return NextResponse.json({ error: "needs_table" }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 3) اضبط الـ webhook على تليجرام
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: webhookUrl, allowed_updates: ["message"] }),
    }).then((r) => r.json());
    if (!res.ok) return NextResponse.json({ error: `تعذّر ربط الـ webhook: ${res.description || ""}` }, { status: 502 });
  } catch {
    return NextResponse.json({ error: "تعذّر ضبط الـ webhook" }, { status: 502 });
  }

  return NextResponse.json({ ok: true, bot_username: botUsername });
}
