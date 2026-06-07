import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "./settings-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Profile } from "@/types/db";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  return (
    <div className="container mx-auto px-4 py-10 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">إعداداتُ العلامة التجارية</h1>
        <p className="text-muted-foreground mt-1">
          عرّف Oji على هويّة علامتك مرّةً واحدة، وستبدأُ كلُّ المشاريع الجديدة من إعداداتك تلقائياً.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>🧠 ذاكرةُ العلامة التجارية (Brand Memory)</CardTitle>
          <CardDescription>
            تُستخدمُ هذه المعلوماتُ بشكلٍ ضمنيٍّ في كلِّ محادثة، ليفكّر Oji بأسلوبِ علامتك دائماً.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SettingsForm profile={profile} userEmail={user.email ?? ""} />
        </CardContent>
      </Card>
    </div>
  );
}
