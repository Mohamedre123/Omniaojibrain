import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateText } from "@/lib/ai/gemini";
import { TOOL_PROMPTS } from "@/lib/ai/tool-prompts";
import { getTemplate } from "@/lib/templates";
import { publishArticle, type SeoPublishConfig } from "@/lib/seo-publish";

export const runtime = "nodejs";
export const maxDuration = 60;

type Sub = {
  id: string;
  user_id: string;
  config: { project_id?: string; keywords?: string[]; publish?: SeoPublishConfig } | null;
};

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const key = req.nextUrl.searchParams.get("key");
  const auth = req.headers.get("authorization");
  return key === secret || auth === `Bearer ${secret}`;
}

async function handle(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "server not configured" }, { status: 500 });

  // كل اشتراكات الأتمتة اليومية المفعّلة
  const { data: rows } = await admin
    .from("oji_connectors")
    .select("id, user_id, config")
    .eq("service", "seo:auto")
    .eq("enabled", true)
    .limit(20);

  const subs = (rows as Sub[]) || [];
  let generated = 0, failed = 0, skipped = 0, published = 0, publishFailed = 0;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  for (const sub of subs) {
    try {
      const cfg = sub.config || {};
      const projectId = cfg.project_id;
      if (!projectId) throw new Error("no project");

      // اتكتب مقال النهاردة قبل كده؟ (idempotent — الكرون ممكن يتكرر)
      const { data: already } = await admin
        .from("deliverables")
        .select("id")
        .eq("project_id", projectId)
        .eq("kind", "note")
        .contains("metadata", { seo_auto: true })
        .gte("created_at", todayStart.toISOString())
        .limit(1);
      if (already && already.length > 0) { skipped++; continue; }

      const { data: project } = await admin
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .eq("user_id", sub.user_id)
        .maybeSingle();
      if (!project) throw new Error("project not found");

      const { data: profile } = await admin
        .from("profiles")
        .select("brand_voice, brand_name, brand_colors")
        .eq("id", sub.user_id)
        .maybeSingle();

      // اختيار موضوع النهاردة — تدوير على الكلمات المفتاحية لو موجودة
      const keywords = Array.isArray(cfg.keywords) ? cfg.keywords.filter((k) => k?.trim()) : [];
      const dayIndex = Math.floor(Date.now() / 86_400_000);
      const topic = keywords.length > 0
        ? keywords[dayIndex % keywords.length]
        : `موضوع جديد ومفيد لجمهور «${project.name}» في مجاله`;

      const template = getTemplate(project.business_type);
      const projectSection = `\n## سياقُ المشروع
- **النوع**: ${template.name}
- **اسم المشروع**: ${project.name}
${project.brief ? `- **وصفُ المشروع**: ${project.brief}` : ""}${project.knowledge ? `\n\n## قاعدة معرفة المشروع (استند إليها)\n${String(project.knowledge).slice(0, 8000)}` : ""}`;

      const brandColors = (profile?.brand_colors as string[] | undefined) || [];
      const brandSection =
        profile?.brand_name || profile?.brand_voice || brandColors.length > 0
          ? `\n## ملفُّ العلامة التجارية
${profile?.brand_name ? `- **اسم العلامة**: ${profile.brand_name}` : ""}
${profile?.brand_voice ? `- **نبرة العلامة**: ${profile.brand_voice}` : ""}`
          : "";

      const systemPrompt = `${TOOL_PROMPTS.seo_article}${projectSection}${brandSection}

ردّ بنفس لغة ولهجة العميل.`;
      const prompt = `اكتب مقال SEO جديد النهاردة عن: «${topic}».
لازم يكون أصلي ومختلف تماماً عن أي مقال سابق، ومناسب لموسم/تاريخ النهاردة لو ينفع.`;

      const content = await generateText({ systemPrompt, prompt });
      if (!content.trim()) throw new Error("empty");

      // نشر تلقائي على منصّة العميل لو معدّة
      let publishInfo: { url?: string; error?: string } = {};
      const pub = cfg.publish;
      if (pub && pub.platform && pub.platform !== "none") {
        try {
          const r = await publishArticle(pub, { title: `${topic}`, markdown: content });
          publishInfo = { url: r.url };
          published++;
        } catch (e) {
          publishInfo = { error: e instanceof Error ? e.message.slice(0, 300) : "فشل النشر" };
          publishFailed++;
        }
      }

      await admin.from("deliverables").insert({
        project_id: projectId,
        user_id: sub.user_id,
        kind: "note",
        title: `📰 مقال SEO — ${topic} — ${new Date().toLocaleDateString("ar-EG")}`,
        content,
        metadata: { seo_auto: true, topic, publish: publishInfo },
      });
      generated++;
    } catch {
      failed++;
    }
  }

  return NextResponse.json({ ok: true, checked: subs.length, generated, skipped, published, publishFailed, failed });
}

export async function GET(req: NextRequest) { return handle(req); }
export async function POST(req: NextRequest) { return handle(req); }
