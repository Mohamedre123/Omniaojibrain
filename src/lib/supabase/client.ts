import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "إعداداتُ Supabase ناقصة. تأكّد من إضافة المتغيّرين NEXT_PUBLIC_SUPABASE_URL و NEXT_PUBLIC_SUPABASE_ANON_KEY في الاستضافة، ثم أعد البناء (Rebuild)."
    );
  }

  return createBrowserClient(url, key);
}
