import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { streamChat } from "@/lib/ai/gemini";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 30;

const schema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(2000),
      })
    )
    .min(1)
    .max(20),
});

const HELP_SYSTEM_PROMPT = `أنت "Oji" مساعدٌ داخل منصة Oji Brain (منصةُ ذكاءٍ اصطناعيٍّ للتسويق).

دورُك: الإجابةُ على أسئلة العميل عن كيفيةِ استخدام المنصة.

معلوماتٌ عن المنصة:
- يستطيع العميل إنشاءَ **مشاريع**؛ لكلِّ مشروعٍ وصفٌ ونوعُ نشاط.
- توجد أربعةُ أوضاعٍ داخل كلِّ مشروع:
  1. **مساعدٌ عام** — أسئلةٌ سريعة، اقتراحُ أفكار، مراجعةُ نصوص.
  2. **استراتيجيةُ تسويق** — خطةٌ متكاملةٌ بأهدافٍ ومحتوًى وميزانية.
  3. **تصميماتٌ إعلانية** — برومبتاتٌ لـ Midjourney / DALL-E / Flux.
  4. **فيديو إعلاني** — برومبتاتٌ لـ Veo / Runway / Kling بكلِّ أنواعها.
- توجد قوالبُ جاهزةٌ لأنواعِ الأنشطة (مطعم، عيادة، أزياء، أكاديمية، إلخ).
- يستطيع العميل حفظَ أيّ ردٍّ في **مكتبة المشروع** وتصديرَه إلى PDF.
- توجد ميزةُ **Magic Brief** لتحليلِ روابطِ المواقع/المنتجاتِ تلقائياً.
- توجد ميزةُ **Brand Memory** في الإعدادات لحفظِ نبرةِ وألوانِ العلامة التجارية.
- يوجد إدخالٌ صوتيٌّ (ميكروفونٌ داخل المحادثة).
- توجد ميزةُ **مشاركةِ المشروع** برابطٍ للقراءة فقط للعميلِ النهائي.

قواعدك:
1. **ردّ بنفس لهجةِ العميل**: إن كتب بالمصرية فبالمصرية، بالخليجية فبالخليجية، بالفصحى فبالفصحى، بالإنجليزية فبالإنجليزية. هذه قاعدةٌ صارمة.
2. كن مختصراً — جوابٌ مباشرٌ لا محاضرة.
3. إن كان السؤالُ عن مشكلةٍ تقنية، اقترح حلاً عملياً.
4. إن كان السؤال خارج نطاق المنصة، اقترح بلطفٍ استخدام وضع المحادثة العامة داخل أيّ مشروع.`;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const rl = rateLimit({ key: `help:${user.id}`, limit: 20, windowSeconds: 60 });
  if (!rl.allowed) {
    return NextResponse.json({ error: "Slow down!" }, { status: 429 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of streamChat({
          systemPrompt: HELP_SYSTEM_PROMPT,
          messages: parsed.data.messages,
        })) {
          controller.enqueue(encoder.encode(chunk));
        }
      } catch {
        controller.enqueue(encoder.encode("\n\n⚠️ في مشكلة، جرب تاني"));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
