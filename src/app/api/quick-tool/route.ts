import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { streamChat } from "@/lib/ai/gemini";
import { rateLimit } from "@/lib/rate-limit";
import { QUICK_TOOL_PROMPTS } from "@/lib/ai/prompts";
import { getTemplate } from "@/lib/templates";

export const runtime = "nodejs";
export const maxDuration = 60;

const schema = z.object({
  tool: z.enum(["hashtags", "content_ideas", "variations", "lead_magnet", "landing_page"]),
  input: z.string().max(5000).optional().default(""),
  project_id: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const rl = rateLimit({ key: `tool:${user.id}`, limit: 15, windowSeconds: 60 });
  if (!rl.allowed) {
    return NextResponse.json({ error: `تجاوزتَ الحدّ، حاول بعد ${rl.resetIn} ثانية` }, { status: 429 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }
  const body = parsed.data;

  // اجلب المشروع + الـ Brand Memory
  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", body.project_id)
    .eq("user_id", user.id)
    .single();

  if (!project) return NextResponse.json({ error: "project not found" }, { status: 404 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("brand_voice, brand_name, brand_colors")
    .eq("id", user.id)
    .maybeSingle();

  const template = getTemplate(project.business_type);

  // بناء system prompt مع كل السياق
  const brandColors = (profile?.brand_colors as string[] | undefined) || [];
  const hasBrandInfo = profile && (profile.brand_name || profile.brand_voice || brandColors.length > 0);

  const brandSection = hasBrandInfo
    ? `
## ملفُّ العلامة التجارية
${profile?.brand_name ? `- **اسم العلامة**: ${profile.brand_name}` : ""}
${profile?.brand_voice ? `- **نبرة العلامة**: ${profile.brand_voice}` : ""}
${brandColors.length > 0 ? `- **ألوان العلامة**: ${brandColors.join(", ")}` : ""}
`
    : "";

  const systemPrompt = `${QUICK_TOOL_PROMPTS[body.tool]}

## سياقُ المشروع
- **النوع**: ${template.name}
- **اسم المشروع**: ${project.name}
${project.brief ? `- **وصفُ المشروع**: ${project.brief}` : ""}
${brandSection}

ردّ بنفس لغة ولهجة العميل.`;

  const userMessage = body.input || "ابدأ بناءً على سياق المشروع.";

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of streamChat({
          systemPrompt,
          messages: [{ role: "user", content: userMessage }],
        })) {
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
