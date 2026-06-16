import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { generateText } from "@/lib/ai/gemini";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;

const schema = z.object({
  url: z.string().min(2, "الرابطُ مطلوب").max(500),
});

/** يكتشف نوع الرابط ويرجع معلوماتٍ مفيدة. */
function detectUrlType(url: string): {
  type: "website" | "instagram" | "facebook" | "tiktok" | "twitter" | "linkedin" | "youtube" | "unknown";
  username?: string;
  fetchUrl: string;
} {
  let normalized = url.trim();
  if (!/^https?:\/\//i.test(normalized)) {
    normalized = "https://" + normalized;
  }

  try {
    const u = new URL(normalized);
    const host = u.hostname.toLowerCase().replace(/^www\./, "");
    const path = u.pathname.replace(/^\//, "").split("/")[0];

    if (host === "instagram.com" || host === "instagr.am") {
      return { type: "instagram", username: path, fetchUrl: normalized };
    }
    if (host === "facebook.com" || host === "fb.com") {
      return { type: "facebook", username: path, fetchUrl: normalized };
    }
    if (host === "tiktok.com" || host === "vm.tiktok.com") {
      return { type: "tiktok", username: path.replace("@", ""), fetchUrl: normalized };
    }
    if (host === "twitter.com" || host === "x.com") {
      return { type: "twitter", username: path, fetchUrl: normalized };
    }
    if (host === "linkedin.com") {
      return { type: "linkedin", username: path, fetchUrl: normalized };
    }
    if (host === "youtube.com" || host === "youtu.be") {
      return { type: "youtube", username: path, fetchUrl: normalized };
    }
    return { type: "website", fetchUrl: normalized };
  } catch {
    return { type: "unknown", fetchUrl: normalized };
  }
}

/** يستخرج meta tags + Open Graph من HTML. */
function extractMeta(html: string): Record<string, string> {
  const meta: Record<string, string> = {};

  // Open Graph
  const ogPattern = /<meta\s+(?:property|name)\s*=\s*["']([^"']+)["']\s+content\s*=\s*["']([^"']+)["']/gi;
  let match;
  while ((match = ogPattern.exec(html)) !== null) {
    meta[match[1].toLowerCase()] = match[2];
  }

  // Title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) meta["title"] = titleMatch[1].trim();

  return meta;
}

/** يستخرج أكثر ألوان HEX تكراراً من كود الصفحة (تقريبٌ لهوية اللون) */
function extractBrandColors(html: string): string[] {
  const counts: Record<string, number> = {};
  const re = /#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    let hex = m[1].toLowerCase();
    if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");
    // تجاهل الأبيض والأسود النقي (شائعة جداً وليست هوية)
    if (hex === "ffffff" || hex === "000000") continue;
    counts["#" + hex] = (counts["#" + hex] || 0) + 1;
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([c]) => c);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const rl = rateLimit({ key: `magic:${user.id}`, limit: 5, windowSeconds: 60 });
  if (!rl.allowed) return NextResponse.json({ error: "تجاوزت الحدّ، حاول بعد دقيقة" }, { status: 429 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const detected = detectUrlType(parsed.data.url);

  // SSRF Protection
  try {
    const u = new URL(detected.fetchUrl);
    const host = u.hostname.toLowerCase();
    if (
      host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0" ||
      host.endsWith(".local") ||
      /^10\./.test(host) || /^192\.168\./.test(host) ||
      /^172\.(1[6-9]|2[0-9]|3[01])\./.test(host)
    ) return NextResponse.json({ error: "هذا الرابطُ غيرُ مسموحٍ به" }, { status: 400 });

    if (u.protocol !== "http:" && u.protocol !== "https:") {
      return NextResponse.json({ error: "يجب أن يبدأ الرابط بـ http أو https" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "الرابطُ غيرُ صحيح" }, { status: 400 });
  }

  // جلب الصفحة
  let html = "";
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);
    const res = await fetch(detected.fetchUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; OjiBrain/1.0; +https://oji.agency)",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });
    clearTimeout(timeout);

    if (!res.ok) {
      // للسوشيال ميديا، حتى لو رفضت الجلب، خلي AI يحاول من اسم اليوزر
      if (detected.type !== "website" && detected.type !== "unknown") {
        html = ""; // هنكمل بدون HTML
      } else {
        return NextResponse.json({ error: `استجابت الصفحةُ بالرمز ${res.status}` }, { status: 400 });
      }
    } else {
      const text = await res.text();
      html = text.slice(0, 250_000);
    }
  } catch {
    // للسوشيال، نكمّل بدون HTML
    if (detected.type === "website" || detected.type === "unknown") {
      return NextResponse.json({ error: "تعذّر الوصولُ إلى هذا الرابط" }, { status: 400 });
    }
  }

  // استخراج Meta + النص
  const meta = extractMeta(html);

  const cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 15_000);

  // بناء البرومبت بناءً على نوع الرابط
  const platformInfo = {
    instagram: "حساب Instagram",
    facebook: "صفحة Facebook",
    tiktok: "حساب TikTok",
    twitter: "حساب X/Twitter",
    linkedin: "صفحة LinkedIn",
    youtube: "قناة YouTube",
    website: "موقع ويب",
    unknown: "صفحة ويب",
  };

  const isSocialMedia = ["instagram", "facebook", "tiktok", "twitter", "linkedin", "youtube"].includes(detected.type);

  let prompt = `حلّل المحتوى التالي من ${platformInfo[detected.type]} واستخرج معلوماتٍ تفصيلية.\n\n`;

  if (detected.username) {
    prompt += `**اسم الحساب**: @${detected.username}\n`;
  }
  prompt += `**الرابط**: ${detected.fetchUrl}\n\n`;

  if (Object.keys(meta).length > 0) {
    prompt += `**معلوماتٌ من Meta Tags**:\n`;
    if (meta["og:title"] || meta["title"]) prompt += `- العنوان: ${meta["og:title"] || meta["title"]}\n`;
    if (meta["og:description"] || meta["description"]) prompt += `- الوصف: ${meta["og:description"] || meta["description"]}\n`;
    if (meta["og:site_name"]) prompt += `- اسم الموقع/الحساب: ${meta["og:site_name"]}\n`;
    if (meta["og:image"]) prompt += `- صورة رئيسية موجودة\n`;
    if (meta["author"]) prompt += `- المؤلف: ${meta["author"]}\n`;
    prompt += `\n`;
  }

  if (cleaned.length > 100) {
    prompt += `**محتوى الصفحة**:\n"""\n${cleaned}\n"""\n\n`;
  } else if (isSocialMedia) {
    prompt += `⚠️ الصفحة لم تُرجع محتوًى كافياً (طبيعيٌّ لمنصّات السوشيال). استنتج من اسم الحساب والمنصّة.\n\n`;
  }

  // 🎨 ألوان الهوية المكتشفة من كود الموقع + theme-color
  const detectedColors = extractBrandColors(html);
  if (meta["theme-color"] && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(meta["theme-color"])) {
    detectedColors.unshift(meta["theme-color"].toLowerCase());
  }
  const uniqueColors = Array.from(new Set(detectedColors)).slice(0, 6);
  if (uniqueColors.length > 0) {
    prompt += `**ألوانٌ مكتشفةٌ من كود/تصميم الموقع (HEX)**: ${uniqueColors.join(", ")}\n\n`;
  }

  prompt += `**المطلوب**: أعد JSON يحوي التالي بدون أيِّ شرحٍ خارجَ JSON:

{
  "brand_name": "اسم العلامة/الحساب",
  "business_type": "نوع النشاط (مطعم/متجر/عيادة/أزياء/تعليم/...)",
  "brief": "وصفٌ تفصيليٌّ 3-5 جُمل عن النشاط",
  "audience": "الجمهور المستهدف بدقة",
  "tone": "نبرة المحتوى (رسمية/مرحة/فاخرة/إلخ)",
  "key_points": ["نقطة بيع 1", "نقطة بيع 2", "نقطة بيع 3"],
  "brand_colors": ["#hex لون أساسي", "#hex لون ثانوي"],
  "platform_strategy": "اقتراحات سريعة لاستراتيجية المنصة"
}

ملاحظاتٌ مهمّة:
- في "brand_colors" استخدم الألوان المكتشفة أعلاه إن كانت تمثّل هوية العلامة (تجاهل الرمادي/الأبيض/الأسود العادي)، وإلا استنتج لوحةَ ألوانٍ منطقيةً للهوية كصيغة HEX (لونان إلى أربعة). إن لم تستطع التخمين، أعد مصفوفةً فارغة.
- كن ذكياً ومستنتجاً حتى لو المعلوماتُ شحيحة.`;

  const key = process.env.GEMINI_API_KEY;
  if (!key) return NextResponse.json({ error: "إعدادات الخادم ناقصة" }, { status: 500 });

  try {
    const response = await generateText({
      systemPrompt: "أنت محلّلُ أعمالٍ خبير. ترجع JSON صحيحاً فقط، دون أيِّ شرحٍ خارجَ JSON.",
      prompt,
    });

    const m = response.match(/\{[\s\S]*\}/);
    if (!m) return NextResponse.json({ error: "تعذّر تحليلُ المحتوى" }, { status: 500 });
    const data = JSON.parse(m[0]);
    return NextResponse.json({ ...data, source_type: detected.type });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "حدثت مشكلة";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
