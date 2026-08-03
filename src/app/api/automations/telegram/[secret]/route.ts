import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { streamClaude } from "@/lib/ai/claude";
import type { ChatMessage } from "@/lib/ai/gemini";

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
      .select("user_id, config, enabled")
      .eq("secret", secret)
      .eq("service", "telegram")
      .maybeSingle();

    if (!conn || conn.enabled === false) return NextResponse.json({ ok: true });
    const cfg = (conn.config || {}) as { token?: string; project_id?: string | null; persona?: string };
    if (!cfg.token) return NextResponse.json({ ok: true });

    // سياق المشروع (اختياري)
    let projectCtx = "";
    if (cfg.project_id) {
      const { data: p } = await admin
        .from("projects")
        .select("name, brief, knowledge, business_type")
        .eq("id", cfg.project_id)
        .maybeSingle();
      if (p) {
        projectCtx = `\n\n## معلومات النشاط (استند إليها في ردودك)
- الاسم: ${p.name}
${p.brief ? `- نبذة: ${p.brief}` : ""}${p.knowledge ? `\n- قاعدة المعرفة:\n${String(p.knowledge).slice(0, 6000)}` : ""}`;
      }
    }

    const systemPrompt = `أنت موظّفُ خدمة عملاءٍ محترفٌ وودود تردّ على عملاء عبر تليجرام نيابةً عن النشاط.
${cfg.persona ? `شخصيتك وتعليماتك: ${cfg.persona}` : "كن مهذّباً، مباشراً، ومفيداً."}
- ردّ بنفس لغة/لهجة العميل، وباختصارٍ مناسبٍ للمحادثة.
- لا تختلق معلومات غير موجودة؛ ولو ما تعرفش، اطلب توضيحاً أو قل إنك هتحوّله لمختصّ.${projectCtx}`;

    const messages: ChatMessage[] = [{ role: "user", content: text }];

    let reply = "";
    try {
      for await (const chunk of streamClaude({ systemPrompt, messages, maxTokens: 1024 })) reply += chunk;
    } catch {
      reply = "معلش، حصل خطأ مؤقّت — جرّب تبعت تاني بعد لحظات.";
    }

    await tgSend(cfg.token, chatId, reply.trim() || "…");
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
