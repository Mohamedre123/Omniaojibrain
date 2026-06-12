"use client";

import { createClient } from "@/lib/supabase/client";

export type LibraryFile = {
  name: string;
  path: string;
  createdAt: string;
  size: number;
  kind: "image" | "video";
  signedUrl?: string;
};

const BUCKET = "uploads";
const FOLDER = "generated";

function extFromMime(mime: string): string {
  if (mime.includes("png")) return "png";
  if (mime.includes("jpeg") || mime.includes("jpg")) return "jpg";
  if (mime.includes("webp")) return "webp";
  if (mime.includes("mp4")) return "mp4";
  if (mime.includes("webm")) return "webm";
  return "bin";
}

/** حفظ صورة (base64) في مكتبة المستخدم تلقائياً */
export async function saveImageToLibrary(base64: string, mimeType: string): Promise<boolean> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const blob = new Blob([bytes], { type: mimeType });
    const path = `${user.id}/${FOLDER}/img-${Date.now()}.${extFromMime(mimeType)}`;

    const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
      contentType: mimeType,
      upsert: false,
    });
    return !error;
  } catch {
    return false;
  }
}

/** حفظ فيديو (Blob) في مكتبة المستخدم تلقائياً */
export async function saveVideoToLibrary(blob: Blob): Promise<boolean> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const mime = blob.type || "video/mp4";
    const path = `${user.id}/${FOLDER}/vid-${Date.now()}.${extFromMime(mime)}`;

    const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
      contentType: mime,
      upsert: false,
    });
    return !error;
  } catch {
    return false;
  }
}

/** قائمة ملفات المستخدم مع روابط مؤقّتة للعرض */
export async function listLibrary(): Promise<LibraryFile[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const prefix = `${user.id}/${FOLDER}`;
  const { data: files, error } = await supabase.storage.from(BUCKET).list(prefix, {
    limit: 200,
    sortBy: { column: "created_at", order: "desc" },
  });
  if (error || !files) return [];

  const valid = files.filter((f) => f.name && !f.name.startsWith("."));
  if (valid.length === 0) return [];

  const paths = valid.map((f) => `${prefix}/${f.name}`);
  const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrls(paths, 3600);

  return valid.map((f, i) => {
    const isVideo = /\.(mp4|webm)$/i.test(f.name);
    return {
      name: f.name,
      path: `${prefix}/${f.name}`,
      createdAt: f.created_at || "",
      size: (f.metadata as { size?: number } | null)?.size || 0,
      kind: isVideo ? "video" : "image",
      signedUrl: signed?.[i]?.signedUrl ?? undefined,
    };
  });
}

/** حذف ملف من المكتبة */
export async function deleteFromLibrary(path: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  return !error;
}
