import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { generateText } from "@/lib/ai/gemini";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;

const schema = z.object({
  url: z.string().url("الرابطُ غيرُ صحيح"),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // Rate limit: 5 تحليلات في الدقيقة
  const rl = rateLimit({ key: `magic:${user.id}`, limit: 5, windowSeconds: 60 });
  if (!rl.allowed) {
    return NextResponse.json({ error: "Slow down!" }, { status: 429 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const url = parsed.data.url;

  // SSRF Protection: امنع localhost و private IPs
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    if (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "0.0.0.0" ||
      host.endsWith(".local") ||
      /^10\./.test(host) ||
      /^192\.168\./.test(host) ||
      /^172\.(1[6-9]|2[0-9]|3[01])\./.test(host)
    ) {
      return NextResponse.json({ error: "هذا الرابطُ غيرُ مسموحٍ به" }, { status: 400 });
    }
    if (u.protocol !== "http:" && u.protocol !== "https:") {
      return NextResponse.json({ error: "يجب أن يبدأ الرابط بـ http أو https" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "الرابطُ غيرُ صحيح" }, { status: 400 });
  }

  // اجلب صفحة الويب
  let html = "";
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "OjiBrain-MagicBrief/1.0",
        Accept: "text/html",
      },
      redirect: "follow",
    });
    clearTimeout(timeout);
    if (!res.ok) {
      return NextResponse.json({ error: `استجابت الصفحةُ بالرمز ${res.status}` }, { status: 400 });
    }
    const text = await res.text();
    html = text.slice(0, 200_000); // حدٌّ أقصى 200KB
  } catch {
    return NextResponse.json({ error: "تعذّر الوصولُ إلى هذا الرابط" }, { status: 400 });
  }

  // نظف الـ HTML — استخرج النص فقط
  const cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 15_000);

  // ابعت لـ Gemini
  const prompt = `حلّل هذا المحتوى من موقع/صفحةِ ويب، واستخرج:

1. **اسمُ العلامة التجارية**
2. **نوعُ النشاط** (مطعم / متجر / عيادة / SaaS / إلخ)
3. **المنتجُ أو الخدمةُ الأساسية**
4. **الجمهورُ المستهدف**
5. **النبرةُ العامة** (رسمية / دارجة / مرحة / احترافية)
6. **نقاطُ البيعِ الأساسية** (USPs)

أعِد الإجابةَ ككائنِ JSON بالشكل التالي فقط (دون markdown أو شرحٍ إضافي):

{
  "brand_name": "...",
  "business_type": "...",
  "brief": "وصفٌ مختصرٌ من 2-3 جملٍ عن النشاط",
  "audience": "...",
  "tone": "...",
  "key_points": ["نقطة 1", "نقطة 2", "نقطة 3"]
}

المحتوى:
"""
${cleaned}
"""`;

  try {
    const response = await generateText({
      systemPrompt: "أنت محلّلُ أعمالٍ محترف. أعِد JSON صحيحاً فقط دون أيِّ شرحٍ خارجَ JSON.",
      prompt,
    });

    // استخرج JSON من الرد (في حالةِ وجودِ Markdown أو شرحٍ زائد)
    const match = response.match(/\{[\s\S]*\}/);
    if (!match) {
      return NextResponse.json({ error: "تعذّر تحليلُ المحتوى" }, { status: 500 });
    }
    const data = JSON.parse(match[0]);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "حدثت مشكلةٌ في التحليل" }, { status: 500 });
  }
}
