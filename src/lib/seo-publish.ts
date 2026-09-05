// نشر مقالات SEO تلقائياً على منصّات المدوّنات
// WordPress = تكامل مباشر · Webhook = موصّل عام لأي منصّة (سلة/زد/كستم/Zapier/Make/n8n)

export type SeoPublishPlatform = "none" | "wordpress" | "webhook";

export type SeoPublishConfig = {
  platform?: SeoPublishPlatform;
  // WordPress
  siteUrl?: string;
  username?: string;
  appPassword?: string;
  status?: "publish" | "draft";
  // Webhook / API عام
  webhookUrl?: string;
  authHeader?: string; // مثال: "Bearer xxxxx" — اختياري
};

export type ArticlePayload = {
  title: string;
  markdown: string;
};

// تحويل ماركداون بسيط → HTML (عناوين، عريض، قوائم، فقرات)
export function mdToHtml(md: string): string {
  const lines = md.replace(/\r/g, "").split("\n");
  const out: string[] = [];
  let inList = false;
  const closeList = () => { if (inList) { out.push("</ul>"); inList = false; } };
  const inline = (s: string) =>
    s
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/\[(.+?)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2">$1</a>');

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) { closeList(); continue; }
    let m;
    if ((m = line.match(/^###\s+(.*)$/))) { closeList(); out.push(`<h3>${inline(m[1])}</h3>`); }
    else if ((m = line.match(/^##\s+(.*)$/))) { closeList(); out.push(`<h2>${inline(m[1])}</h2>`); }
    else if ((m = line.match(/^#\s+(.*)$/))) { closeList(); out.push(`<h2>${inline(m[1])}</h2>`); }
    else if ((m = line.match(/^\s*[-*]\s+(.*)$/))) {
      if (!inList) { out.push("<ul>"); inList = true; }
      out.push(`<li>${inline(m[1])}</li>`);
    } else { closeList(); out.push(`<p>${inline(line)}</p>`); }
  }
  closeList();
  return out.join("\n");
}

// تنظيف مخرج أداة seo_article للنشر: نشيل سقالة الكلمات المفتاحية/الميتا،
// وننشر جسم المقال + الأسئلة الشائعة + الدعوة للعمل فقط.
export function cleanArticleForPublish(md: string): string {
  const marker = md.search(/##\s*[^\n]*المقال/);
  if (marker > 0) return md.slice(marker).replace(/^##\s*[^\n]*المقال[^\n]*\n/, "").trim();
  return md.trim();
}

async function publishWordPress(cfg: SeoPublishConfig, article: ArticlePayload): Promise<{ url?: string }> {
  const base = (cfg.siteUrl || "").trim().replace(/\/+$/, "");
  if (!base || !cfg.username || !cfg.appPassword) throw new Error("بيانات WordPress ناقصة");
  const auth = Buffer.from(`${cfg.username}:${cfg.appPassword}`).toString("base64");
  const res = await fetch(`${base}/wp-json/wp/v2/posts`, {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      title: article.title,
      content: mdToHtml(cleanArticleForPublish(article.markdown)),
      status: cfg.status === "draft" ? "draft" : "publish",
    }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    if (res.status === 401) throw new Error("WordPress: بيانات الدخول غلط (تأكد من Application Password)");
    throw new Error(`WordPress رجّع ${res.status}: ${t.slice(0, 200)}`);
  }
  const data = await res.json().catch(() => ({}));
  return { url: data?.link };
}

async function publishWebhook(cfg: SeoPublishConfig, article: ArticlePayload): Promise<{ url?: string }> {
  const url = (cfg.webhookUrl || "").trim();
  if (!/^https?:\/\//.test(url)) throw new Error("رابط الـ Webhook غير صحيح");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (cfg.authHeader?.trim()) headers["Authorization"] = cfg.authHeader.trim();
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      source: "oji-brain",
      title: article.title,
      content_markdown: article.markdown,
      content_html: mdToHtml(cleanArticleForPublish(article.markdown)),
      published_at: new Date().toISOString(),
    }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`الـ Webhook رجّع ${res.status}: ${t.slice(0, 200)}`);
  }
  return {};
}

export async function publishArticle(cfg: SeoPublishConfig, article: ArticlePayload): Promise<{ url?: string }> {
  switch (cfg.platform) {
    case "wordpress": return publishWordPress(cfg, article);
    case "webhook": return publishWebhook(cfg, article);
    default: throw new Error("لا توجد منصّة نشر مُعدّة");
  }
}
