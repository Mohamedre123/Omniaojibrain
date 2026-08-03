import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { runAgentReply, type AgentConfig } from "@/lib/automations";

export const runtime = "nodejs";
export const maxDuration = 60;

async function tgSend(token: string, chatId: number, text: string) {
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: text.slice(0, 4096) }),
  }).catch(() => {});
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ secret: string }> }) {
  const { secret } = await params;
  // نرجّع 200 دائماً حتى لا يعيد تليجرام المحاولة بلا نهاية
  try {
    const update = await req.json().catch(() => null);
    const msg = update?.message;
    const text: string | undefined = msg?.text;
    const chatId: number | undefined = msg?.chat?.id;
    if (!text || !chatId) return NextResponse.json({ ok: true });

    const admin = createAdminClient();
    if (!admin) return NextResponse.json({ ok: true });

    const { data: conn } = await admin
      .from("oji_connectors")
      .select("config, enabled")
      .eq("secret", secret)
      .eq("service", "telegram")
      .maybeSingle();

    if (!conn || conn.enabled === false) return NextResponse.json({ ok: true });
    const cfg = (conn.config || {}) as AgentConfig;
    if (!cfg.token) return NextResponse.json({ ok: true });

    const reply = await runAgentReply(admin, cfg, text, "تليجرام");
    await tgSend(cfg.token, chatId, reply);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
