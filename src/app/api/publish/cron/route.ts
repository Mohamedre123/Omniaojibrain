import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { publishToPlatform, type PublishConfig, type PublishPlatform } from "@/lib/publish";

export const runtime = "nodejs";
export const maxDuration = 60;

type Scheduled = { id: string; user_id: string; platform: PublishPlatform; text: string; image_paths: string[]; publish_at: string };

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

  const nowIso = new Date().toISOString();
  const { data: due } = await admin
    .from("scheduled_posts")
    .select("id, user_id, platform, text, image_paths, publish_at")
    .eq("status", "pending")
    .lte("publish_at", nowIso)
    .limit(20);

  const posts = (due as Scheduled[]) || [];
  let published = 0, failed = 0;

  for (const post of posts) {
    try {
      const { data: conn } = await admin
        .from("oji_connectors")
        .select("config")
        .eq("user_id", post.user_id)
        .eq("service", `publish:${post.platform}`)
        .maybeSingle();
      if (!conn) throw new Error("المنصّة مش مربوطة");

      // إعادة توقيع مسارات الصور وقت النشر (روابط طازجة)
      const images: string[] = [];
      for (const path of post.image_paths || []) {
        const { data: signed } = await admin.storage.from("uploads").createSignedUrl(path, 60 * 60);
        if (signed?.signedUrl) images.push(signed.signedUrl);
      }

      await publishToPlatform(post.platform, (conn.config || {}) as PublishConfig, post.text, images);
      await admin.from("scheduled_posts").update({ status: "published", error: null }).eq("id", post.id);
      published++;
    } catch (e) {
      await admin.from("scheduled_posts").update({ status: "failed", error: e instanceof Error ? e.message.slice(0, 300) : "فشل" }).eq("id", post.id);
      failed++;
    }
  }

  return NextResponse.json({ ok: true, checked: posts.length, published, failed });
}

export async function GET(req: NextRequest) { return handle(req); }
export async function POST(req: NextRequest) { return handle(req); }
