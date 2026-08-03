import type { SupabaseClient } from "@supabase/supabase-js";
import { streamClaude } from "@/lib/ai/claude";
import type { ChatMessage } from "@/lib/ai/gemini";

export type AgentConfig = {
  persona?: string;
  project_id?: string | null;
  token?: string;
  bot_username?: string;
};

/** يبني ردّ الوكيل (نفس المنطق لكل القنوات: تليجرام، API عام، إلخ) */
export async function runAgentReply(
  admin: SupabaseClient,
  config: AgentConfig,
  message: string,
  channel = "المحادثة"
): Promise<string> {
  let projectCtx = "";
  if (config.project_id) {
    const { data: p } = await admin
      .from("projects")
      .select("name, brief, knowledge")
      .eq("id", config.project_id)
      .maybeSingle();
    if (p) {
      projectCtx = `\n\n## معلومات النشاط (استند إليها في ردودك)
- الاسم: ${p.name}
${p.brief ? `- نبذة: ${p.brief}` : ""}${p.knowledge ? `\n- قاعدة المعرفة:\n${String(p.knowledge).slice(0, 6000)}` : ""}`;
    }
  }

  const systemPrompt = `أنت موظّفُ خدمة عملاءٍ محترفٌ وودود تردّ على عملاء عبر ${channel} نيابةً عن النشاط.
${config.persona ? `شخصيتك وتعليماتك: ${config.persona}` : "كن مهذّباً، مباشراً، ومفيداً."}
- ردّ بنفس لغة/لهجة العميل، وباختصارٍ مناسبٍ للمحادثة.
- لا تختلق معلومات؛ ولو ما تعرفش، اطلب توضيحاً أو قل إنك هتحوّله لمختصّ.${projectCtx}`;

  const messages: ChatMessage[] = [{ role: "user", content: message }];
  let reply = "";
  try {
    for await (const chunk of streamClaude({ systemPrompt, messages, maxTokens: 1024 })) reply += chunk;
  } catch {
    reply = "معلش، حصل خطأ مؤقّت — جرّب تبعت تاني بعد لحظات.";
  }
  return reply.trim() || "…";
}
