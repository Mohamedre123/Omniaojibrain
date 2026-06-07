import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { streamChat, type ChatMessage } from "@/lib/ai/gemini";
import { buildSystemPrompt, type WorkflowMode } from "@/lib/ai/prompts";
import { getTemplate } from "@/lib/templates";
import { chatRequestSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Rate limit: 30 رسالة في الدقيقة لكل يوزر
  const rl = rateLimit({
    key: `chat:${user.id}`,
    limit: 30,
    windowSeconds: 60,
  });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: `تجاوزتَ الحدّ المسموحَ به. حاول بعد ${rl.resetIn} ثانية.` },
      { status: 429, headers: { "Retry-After": String(rl.resetIn) } }
    );
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const parsed = chatRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "بياناتٌ غيرُ صحيحة" },
      { status: 400 }
    );
  }
  const body = parsed.data;

  const { data: convo, error: convoErr } = await supabase
    .from("conversations")
    .select("*, project:projects(*)")
    .eq("id", body.conversation_id)
    .eq("user_id", user.id)
    .single();

  if (convoErr || !convo) {
    return NextResponse.json({ error: "conversation not found" }, { status: 404 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("brand_voice, brand_name, brand_colors")
    .eq("id", user.id)
    .single();

  const { data: history } = await supabase
    .from("messages")
    .select("role, content")
    .eq("conversation_id", body.conversation_id)
    .order("created_at", { ascending: true })
    .limit(40);

  const project = convo.project;
  const template = getTemplate(project?.business_type ?? "general");

  const systemPrompt = buildSystemPrompt({
    mode: convo.mode as WorkflowMode,
    template,
    projectBrief: project?.brief ?? undefined,
    brandVoice: profile?.brand_voice ?? undefined,
    brandName: profile?.brand_name ?? undefined,
    brandColors: (profile?.brand_colors as string[] | undefined) ?? undefined,
  });

  const messages: ChatMessage[] = [
    ...(history ?? []).map((m): ChatMessage => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    {
      role: "user",
      content: body.message,
      imageData: body.attachments
        ?.filter((a) => a.base64 && a.type.startsWith("image/"))
        .map((a) => ({ mimeType: a.type, data: a.base64! })),
    },
  ];

  // حفظ رسالة المستخدم فوراً
  await supabase.from("messages").insert({
    conversation_id: body.conversation_id,
    user_id: user.id,
    role: "user",
    content: body.message,
    attachments: body.attachments?.map((a) => ({ url: a.url, type: a.type, name: a.name })) ?? [],
  });

  // Stream response
  const encoder = new TextEncoder();
  let fullResponse = "";

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of streamChat({ systemPrompt, messages })) {
          fullResponse += chunk;
          controller.enqueue(encoder.encode(chunk));
        }
        // حفظ رد الـ AI بعد ما يخلص
        await supabase.from("messages").insert({
          conversation_id: body.conversation_id,
          user_id: user.id,
          role: "assistant",
          content: fullResponse,
        });
        await supabase
          .from("conversations")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", body.conversation_id);
        await supabase
          .from("projects")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", project.id);
        controller.close();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "خطأٌ غيرُ متوقّع";
        controller.enqueue(encoder.encode(`\n\n⚠️ ${msg}`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
