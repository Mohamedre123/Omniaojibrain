import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;

const GRAPH = "https://graph.facebook.com/v21.0";

const schema = z.object({
  platform: z.enum(["facebook", "instagram", "telegram", "linkedin"]),
  text: z.string().max(6000).optional().default(""),
  images: z.array(z.string().url()).max(10).optional().default([]),
});

async function jpost(url: string, body: unknown, headers: Record<string, string> = {}) {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}
function fbErr(data: unknown): string {
  const e = (data as { error?: { message?: string } })?.error;
  return e?.message || "فشل النشر";
}

// ===== Facebook Page =====
async function publishFacebook(cfg: { token: string; target: string }, text: string, images: string[]) {
  const { token, target } = cfg;
  if (!target) throw new Error("محتاج Page ID للفيسبوك");
  if (images.length === 0) {
    const r = await jpost(`${GRAPH}/${target}/feed`, { message: text, access_token: token });
    if (!r.ok) throw new Error(fbErr(r.data));
    return;
  }
  if (images.length === 1) {
    const r = await jpost(`${GRAPH}/${target}/photos`, { url: images[0], caption: text, access_token: token });
    if (!r.ok) throw new Error(fbErr(r.data));
    return;
  }
  // عدّة صور: ارفعها غير منشورة ثم اربطها بمنشور
  const ids: string[] = [];
  for (const url of images) {
    const r = await jpost(`${GRAPH}/${target}/photos`, { url, published: false, access_token: token });
    if (!r.ok) throw new Error(fbErr(r.data));
    ids.push((r.data as { id: string }).id);
  }
  const r = await jpost(`${GRAPH}/${target}/feed`, {
    message: text,
    attached_media: ids.map((id) => ({ media_fbid: id })),
    access_token: token,
  });
  if (!r.ok) throw new Error(fbErr(r.data));
}

// ===== Instagram Business =====
async function publishInstagram(cfg: { token: string; target: string }, text: string, images: string[]) {
  const { token, target } = cfg;
  if (!target) throw new Error("محتاج Instagram User ID");
  if (images.length === 0) throw new Error("انستجرام محتاج صورة واحدة على الأقل");

  let creationId: string;
  if (images.length === 1) {
    const c = await jpost(`${GRAPH}/${target}/media`, { image_url: images[0], caption: text, access_token: token });
    if (!c.ok) throw new Error(fbErr(c.data));
    creationId = (c.data as { id: string }).id;
  } else {
    const childIds: string[] = [];
    for (const url of images) {
      const ch = await jpost(`${GRAPH}/${target}/media`, { image_url: url, is_carousel_item: true, access_token: token });
      if (!ch.ok) throw new Error(fbErr(ch.data));
      childIds.push((ch.data as { id: string }).id);
    }
    const car = await jpost(`${GRAPH}/${target}/media`, { media_type: "CAROUSEL", children: childIds, caption: text, access_token: token });
    if (!car.ok) throw new Error(fbErr(car.data));
    creationId = (car.data as { id: string }).id;
  }
  const pub = await jpost(`${GRAPH}/${target}/media_publish`, { creation_id: creationId, access_token: token });
  if (!pub.ok) throw new Error(fbErr(pub.data));
}

// ===== Telegram (channel/chat) =====
async function publishTelegram(cfg: { token: string; target: string }, text: string, images: string[]) {
  const { token, target } = cfg;
  if (!target) throw new Error("محتاج معرّف القناة (مثل @channel)");
  const base = `https://api.telegram.org/bot${token}`;
  if (images.length === 0) {
    const r = await jpost(`${base}/sendMessage`, { chat_id: target, text });
    if (!r.ok) throw new Error((r.data as { description?: string }).description || "فشل");
  } else if (images.length === 1) {
    const r = await jpost(`${base}/sendPhoto`, { chat_id: target, photo: images[0], caption: text });
    if (!r.ok) throw new Error((r.data as { description?: string }).description || "فشل");
  } else {
    const media = images.map((url, i) => ({ type: "photo", media: url, ...(i === 0 ? { caption: text } : {}) }));
    const r = await jpost(`${base}/sendMediaGroup`, { chat_id: target, media });
    if (!r.ok) throw new Error((r.data as { description?: string }).description || "فشل");
  }
}

// ===== LinkedIn (نصّ) =====
async function publishLinkedin(cfg: { token: string; target: string }, text: string) {
  const { token, target } = cfg;
  if (!target) throw new Error("محتاج Author URN (مثل urn:li:person:xxxx)");
  const r = await jpost("https://api.linkedin.com/v2/ugcPosts", {
    author: target,
    lifecycleState: "PUBLISHED",
    specificContent: { "com.linkedin.ugc.ShareContent": { shareCommentary: { text }, shareMediaCategory: "NONE" } },
    visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
  }, { Authorization: `Bearer ${token}`, "X-Restli-Protocol-Version": "2.0.0" });
  if (!r.ok) throw new Error((r.data as { message?: string }).message || "فشل النشر على لينكدإن");
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const rl = rateLimit({ key: `publish:${user.id}`, limit: 20, windowSeconds: 60 });
  if (!rl.allowed) return NextResponse.json({ error: "تجاوزت الحدّ، حاول بعد قليل" }, { status: 429 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });
  const { platform, text, images } = parsed.data;
  if (!text.trim() && images.length === 0) return NextResponse.json({ error: "اكتب نصّ أو ارفع صورة" }, { status: 400 });

  const { data: conn } = await supabase
    .from("oji_connectors")
    .select("config")
    .eq("user_id", user.id)
    .eq("service", `publish:${platform}`)
    .maybeSingle();
  if (!conn) return NextResponse.json({ error: "المنصّة دي مش مربوطة — اربطها بالـ API الأول" }, { status: 400 });
  const cfg = (conn.config || {}) as { token: string; target: string };

  try {
    if (platform === "facebook") await publishFacebook(cfg, text, images);
    else if (platform === "instagram") await publishInstagram(cfg, text, images);
    else if (platform === "telegram") await publishTelegram(cfg, text, images);
    else if (platform === "linkedin") await publishLinkedin(cfg, text);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "فشل النشر" }, { status: 502 });
  }
}
