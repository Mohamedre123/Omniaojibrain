import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

const schema = z.object({
  project_id: z.string().uuid().optional(),
  persona: z.string().max(2000).optional().default(""),
  name: z.string().max(100).optional().default("وكيل"),
});

function siteUrl(req: NextRequest): string {
  const env = process.env.NEXT_PUBLIC_SITE_URL;
  if (env && env.startsWith("http") && !env.includes("localhost")) return env.replace(/\/$/, "");
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") || "https";
  return host ? `${proto}://${host}` : (env || "").replace(/\/$/, "");
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });
  const { project_id, persona, name } = parsed.data;

  const secret = randomUUID().replace(/-/g, "");
  const { error } = await supabase.from("oji_connectors").insert({
    user_id: user.id,
    service: "agent",
    secret,
    config: { project_id: project_id || null, persona: persona || "", name },
    enabled: true,
  });
  if (error) {
    if (/relation .* does not exist|oji_connectors/i.test(error.message)) {
      return NextResponse.json({ error: "needs_table" }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const url = `${siteUrl(req)}/api/automations/agent/${secret}`;
  return NextResponse.json({ ok: true, secret, url });
}
