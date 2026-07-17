"use client";

import { createClient } from "@/lib/supabase/client";
import { signedUrlFor } from "@/lib/media-library";

// تزامن محادثات الاستوديو عبر قاعدة البيانات (تظهر على كل أجهزة المستخدم).
// نعيد استخدام جدولَي conversations + messages الموجودين (RLS مفعّل):
//   - مشروع مخفي business_type = 'studio'
//   - محادثة mode='design' لشات الصور، و mode='video' لشات الفيديو
//   - الوسائط تُخزَّن في bucket uploads ونحفظ مسارها في attachments

export type StudioMode = "image" | "video";

export type CloudMsg = {
  id: string;
  role: "user" | "assistant";
  text?: string;
  kind: StudioMode;
  imageSrc?: string;
  videoSrc?: string;
  mediaPath?: string;
  mimeType?: string;
  status: "done";
};

type ConvoIds = { image: string; video: string } | null;

/** أنشئ/أحضر مشروع الاستوديو المخفي + محادثتَي الصور والفيديو */
export async function ensureStudioConversations(): Promise<ConvoIds> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // المشروع المخفي
    let { data: project } = await supabase
      .from("projects")
      .select("id")
      .eq("user_id", user.id)
      .eq("business_type", "studio")
      .limit(1)
      .maybeSingle();

    if (!project) {
      const { data: created } = await supabase
        .from("projects")
        .insert({ user_id: user.id, name: "Studio", business_type: "studio", cover_color: "violet" })
        .select("id")
        .single();
      project = created;
    }
    if (!project) return null;

    // المحادثات
    const { data: convos } = await supabase
      .from("conversations")
      .select("id, mode")
      .eq("project_id", project.id);

    const list = convos ?? [];
    const ensure = async (mode: "design" | "video"): Promise<string | null> => {
      const found = list.find((c) => c.mode === mode);
      if (found) return found.id as string;
      const { data: created } = await supabase
        .from("conversations")
        .insert({ project_id: project!.id, user_id: user.id, mode, title: null })
        .select("id")
        .single();
      return created?.id ?? null;
    };

    const imageId = await ensure("design");
    const videoId = await ensure("video");
    if (!imageId || !videoId) return null;
    return { image: imageId, video: videoId };
  } catch {
    return null;
  }
}

type SB = ReturnType<typeof createClient>;

/** أحضر/أنشئ مشروع الاستوديو المخفي */
async function getStudioProjectId(supabase: SB, userId: string): Promise<string | null> {
  const { data: project } = await supabase
    .from("projects").select("id").eq("user_id", userId).eq("business_type", "studio").limit(1).maybeSingle();
  if (project) return project.id as string;
  const { data: created } = await supabase
    .from("projects").insert({ user_id: userId, name: "Studio", business_type: "studio", cover_color: "violet" })
    .select("id").single();
  return created?.id ?? null;
}

export type StudioSession = { id: string; title: string; updatedAt: string };

/** قائمة سيشنات وضعٍ معيّن (صور/فيديو) الأحدث أولاً */
export async function listStudioSessions(mode: StudioMode): Promise<StudioSession[]> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const projectId = await getStudioProjectId(supabase, user.id);
    if (!projectId) return [];
    const dbMode = mode === "image" ? "design" : "video";
    const { data } = await supabase
      .from("conversations").select("id, title, updated_at")
      .eq("project_id", projectId).eq("mode", dbMode)
      .order("updated_at", { ascending: false });
    return (data ?? []).map((c) => ({ id: c.id as string, title: (c.title as string) || "جلسة", updatedAt: c.updated_at as string }));
  } catch {
    return [];
  }
}

/** أنشئ سيشن جديد لوضعٍ معيّن */
export async function createStudioSession(mode: StudioMode, title: string): Promise<string | null> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const projectId = await getStudioProjectId(supabase, user.id);
    if (!projectId) return null;
    const dbMode = mode === "image" ? "design" : "video";
    const { data } = await supabase
      .from("conversations").insert({ project_id: projectId, user_id: user.id, mode: dbMode, title })
      .select("id").single();
    return data?.id ?? null;
  } catch {
    return null;
  }
}

export async function renameStudioSession(id: string, title: string): Promise<void> {
  try { const supabase = createClient(); await supabase.from("conversations").update({ title }).eq("id", id); } catch {}
}

export async function deleteStudioSession(id: string): Promise<void> {
  try {
    const supabase = createClient();
    await supabase.from("messages").delete().eq("conversation_id", id);
    await supabase.from("conversations").delete().eq("id", id);
  } catch {}
}

/** حمّل رسائل محادثة معيّنة وحوّلها لعرض (مع روابط موقّعة للوسائط) */
export async function loadStudioMessages(convoId: string, kind: StudioMode): Promise<CloudMsg[]> {
  try {
    const supabase = createClient();
    const { data: rows } = await supabase
      .from("messages")
      .select("id, role, content, attachments, created_at")
      .eq("conversation_id", convoId)
      .order("created_at", { ascending: true });

    if (!rows) return [];

    const out: CloudMsg[] = [];
    for (const r of rows) {
      const att = (r.attachments as Array<{ url?: string; type?: string }> | null) ?? [];
      const media = att[0];
      const base: CloudMsg = {
        id: r.id as string,
        role: r.role as "user" | "assistant",
        text: (r.content as string) || undefined,
        kind,
        status: "done",
      };
      if (media?.url) {
        const signed = await signedUrlFor(media.url);
        base.mediaPath = media.url;
        if (media.type === "video") {
          base.videoSrc = signed ?? undefined;
        } else {
          base.imageSrc = signed ?? undefined;
          base.mimeType = media.type && media.type.startsWith("image/") ? media.type : "image/png";
        }
      }
      out.push(base);
    }
    return out;
  } catch {
    return [];
  }
}

/** أضف رسالة للمحادثة (تُحفظ في القاعدة فتظهر على باقي الأجهزة) */
export async function addStudioMessage(opts: {
  convoId: string;
  role: "user" | "assistant";
  text?: string;
  mediaPath?: string;
  mediaType?: string; // mime للصورة أو "video"
}): Promise<void> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const attachments = opts.mediaPath
      ? [{ url: opts.mediaPath, type: opts.mediaType || "image/png" }]
      : [];
    await supabase.from("messages").insert({
      conversation_id: opts.convoId,
      user_id: user.id,
      role: opts.role,
      content: opts.text ?? "",
      attachments,
    });
    await supabase
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", opts.convoId);
  } catch {
    // تجاهل — لو فشل التزامن، الواجهة المحلية تبقى شغّالة
  }
}

/** امسح كل رسائل محادثة (زرّ "جديد") */
export async function clearStudioConversation(convoId: string): Promise<void> {
  try {
    const supabase = createClient();
    await supabase.from("messages").delete().eq("conversation_id", convoId);
  } catch {
    // تجاهل
  }
}
