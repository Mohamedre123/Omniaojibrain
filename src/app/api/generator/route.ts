import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { streamChat, type ChatMessage } from "@/lib/ai/gemini";
import { streamClaude } from "@/lib/ai/claude";
import { rateLimit } from "@/lib/rate-limit";
import { TOOL_PROMPTS, type ToolKey } from "@/lib/ai/tool-prompts";
import { getTemplate } from "@/lib/templates";

export const runtime = "nodejs";
export const maxDuration = 60;

const schema = z.object({
  tool: z.string().min(1).max(64),
  input: z.string().max(8000).optional().default(""),
  project_id: z.string().uuid().optional(),
  attachments: z
    .array(
      z.object({
        type: z.string().max(100),
        base64: z.string().max(10 * 1024 * 1024),
      })
    )
    .max(4)
    .optional(),
  provider: z.enum(["gemini", "claude"]).optional(),
  model: z.string().max(64).optional(),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const rl = rateLimit({ key: `gen:${user.id}`, limit: 20, windowSeconds: 60 });
  if (!rl.allowed) {
    return NextResponse.json({ error: `تجاوزت الحدّ، حاول بعد ${rl.resetIn} ثانية` }, { status: 429 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }
  const body = parsed.data;

  const toolPrompt = TOOL_PROMPTS[body.tool as ToolKey];
  if (!toolPrompt) {
    return NextResponse.json({ error: "أداةٌ غيرُ معروفة" }, { status: 400 });
  }

  // اجلب Brand Memory
  const { data: profile } = await supabase
    .from("profiles")
    .select("brand_voice, brand_name, brand_colors")
    .eq("id", user.id)
    .maybeSingle();

  let projectSection = "";
  if (body.project_id) {
    const { data: project } = await supabase
      .from("projects")
      .select("*")
      .eq("id", body.project_id)
      .eq("user_id", user.id)
      .single();

    if (project) {
      const template = getTemplate(project.business_type);
      projectSection = `\n## سياقُ المشروع
- **النوع**: ${template.name}
- **اسم المشروع**: ${project.name}
${project.brief ? `- **وصفُ المشروع**: ${project.brief}` : ""}${project.knowledge ? `\n\n## قاعدة معرفة المشروع (استند إليها)\n${String(project.knowledge).slice(0, 8000)}` : ""}`;
    }
  }

  const brandColors = (profile?.brand_colors as string[] | undefined) || [];
  const brandSection =
    profile?.brand_name || profile?.brand_voice || brandColors.length > 0
      ? `\n## ملفُّ العلامة التجارية
${profile?.brand_name ? `- **اسم العلامة**: ${profile.brand_name}` : ""}
${profile?.brand_voice ? `- **نبرة العلامة**: ${profile.brand_voice}` : ""}
${brandColors.length > 0 ? `- **ألوان العلامة (Hex)**: ${brandColors.join(", ")} (استخدمها بالضبط في كلّ مخرج بصري)` : ""}`
      : "";

  const systemPrompt = `${toolPrompt}${projectSection}${brandSection}

ردّ بنفس لغة ولهجة العميل (لو كتب بمصري، ردّ بمصري؛ لو فصحى، فصحى؛ إلخ).`;

  const userMessage = body.input || "ابدأ بناءً على السياق المتاح.";

  const messages: ChatMessage[] = [
    {
      role: "user",
      content: userMessage,
      imageData: body.attachments
        ?.filter((a) => a.type.startsWith("image/"))
        .map((a) => ({ mimeType: a.type, data: a.base64 })),
    },
  ];

  // المزوّد: للّاندينج بيدج والبرمجة نفضّل Claude لو المفتاح موجود
  const rawObj = (parsed.data ?? {}) as Record<string, unknown>;
  const wantClaude = rawObj.provider === "claude";
  const useClaude = wantClaude && !!process.env.ANTHROPIC_API_KEY;
  const claudeModel = typeof rawObj.model === "string" ? rawObj.model : undefined;
  const generator = useClaude
    ? streamClaude({ systemPrompt, messages, model: claudeModel, maxTokens: 32000 })
    : streamChat({ systemPrompt, messages });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of generator) {
          controller.enqueue(encoder.encode(chunk));
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "حدثت مشكلة";
        controller.enqueue(encoder.encode(`\n\n⚠️ ${msg}`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
