// منطق النشر لكل منصّة — مشترك بين النشر الفوري والجدولة (Cron)
const GRAPH = "https://graph.facebook.com/v21.0";

export type PublishPlatform = "facebook" | "instagram" | "telegram" | "linkedin";
export type PublishConfig = { token: string; target: string };

async function jpost(url: string, body: unknown, headers: Record<string, string> = {}) {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}
function fbErr(data: unknown): string {
  return (data as { error?: { message?: string } })?.error?.message || "فشل النشر";
}
function descErr(data: unknown): string {
  return (data as { description?: string })?.description || "فشل";
}

async function publishFacebook(cfg: PublishConfig, text: string, images: string[]) {
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
  const ids: string[] = [];
  for (const url of images) {
    const r = await jpost(`${GRAPH}/${target}/photos`, { url, published: false, access_token: token });
    if (!r.ok) throw new Error(fbErr(r.data));
    ids.push((r.data as { id: string }).id);
  }
  const r = await jpost(`${GRAPH}/${target}/feed`, { message: text, attached_media: ids.map((id) => ({ media_fbid: id })), access_token: token });
  if (!r.ok) throw new Error(fbErr(r.data));
}

async function publishInstagram(cfg: PublishConfig, text: string, images: string[]) {
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

async function publishTelegram(cfg: PublishConfig, text: string, images: string[]) {
  const { token, target } = cfg;
  if (!target) throw new Error("محتاج معرّف القناة (مثل @channel)");
  const base = `https://api.telegram.org/bot${token}`;
  if (images.length === 0) {
    const r = await jpost(`${base}/sendMessage`, { chat_id: target, text });
    if (!r.ok) throw new Error(descErr(r.data));
  } else if (images.length === 1) {
    const r = await jpost(`${base}/sendPhoto`, { chat_id: target, photo: images[0], caption: text });
    if (!r.ok) throw new Error(descErr(r.data));
  } else {
    const media = images.map((url, i) => ({ type: "photo", media: url, ...(i === 0 ? { caption: text } : {}) }));
    const r = await jpost(`${base}/sendMediaGroup`, { chat_id: target, media });
    if (!r.ok) throw new Error(descErr(r.data));
  }
}

async function publishLinkedin(cfg: PublishConfig, text: string) {
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

export async function publishToPlatform(platform: PublishPlatform, cfg: PublishConfig, text: string, images: string[]) {
  if (platform === "facebook") return publishFacebook(cfg, text, images);
  if (platform === "instagram") return publishInstagram(cfg, text, images);
  if (platform === "telegram") return publishTelegram(cfg, text, images);
  if (platform === "linkedin") return publishLinkedin(cfg, text);
  throw new Error("منصّة غير مدعومة");
}
