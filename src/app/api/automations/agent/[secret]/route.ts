import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { runAgentReply, type AgentConfig } from "@/lib/automations";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ secret: string }> }) {
  const { secret } = await params;
  const body = await req.json().catch(() => null);
  const message: unknown = body?.message;
  if (typeof message !== "string" || !message.trim()) {
    return NextResponse.json({ error: "message مطلوب" }, { status: 400, headers: CORS });
  }

  const rl = rateLimit({ key: `agent:${secret}`, limit: 30, windowSeconds: 60 });
  if (!rl.allowed) return NextResponse.json({ error: "تجاوزت الحدّ، حاول بعد قليل" }, { status: 429, headers: CORS });

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "الخادم غير مضبوط" }, { status: 500, headers: CORS });

  const { data: conn } = await admin
    .from("oji_connectors")
    .select("config, enabled")
    .eq("secret", secret)
    .maybeSingle();

  if (!conn || conn.enabled === false) return NextResponse.json({ error: "الوكيل غير موجود" }, { status: 404, headers: CORS });

  const reply = await runAgentReply(admin, (conn.config || {}) as AgentConfig, message.slice(0, 4000), "الموقع");
  return NextResponse.json({ reply }, { status: 200, headers: CORS });
}
