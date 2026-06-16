import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTemplate } from "@/lib/templates";
import { ProjectWorkspace } from "../projects/[id]/project-workspace";
import { Brain } from "lucide-react";
import type { Conversation, Message, Project, Deliverable } from "@/types/db";

export const dynamic = "force-dynamic";

/**
 * المساعد العام — محادثةٌ ذكيةٌ متاحةٌ مباشرةً من القائمة الجانبية دون فتح مشروع.
 * تقنياً هو "مشروعٌ شخصيٌّ دائم" من نوع assistant مخفيٌّ عن قائمة المشاريع.
 */
export default async function AssistantPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // ابحث عن مشروع المساعد الخاص بالمستخدم أو أنشئه
  let { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", user.id)
    .eq("business_type", "assistant")
    .limit(1)
    .maybeSingle<Project>();

  if (!project) {
    const { data: created } = await supabase
      .from("projects")
      .insert({
        user_id: user.id,
        name: "المساعد العام",
        brief: null,
        business_type: "assistant",
        cover_color: "violet",
      })
      .select()
      .single<Project>();
    project = created;
  }

  if (!project) redirect("/dashboard");

  const { data: conversations } = await supabase
    .from("conversations")
    .select("*")
    .eq("project_id", project.id)
    .order("created_at", { ascending: true });

  let convos = (conversations ?? []) as Conversation[];

  if (convos.length === 0) {
    const { data: newConvo } = await supabase
      .from("conversations")
      .insert({
        project_id: project.id,
        user_id: user.id,
        mode: "chat",
        title: null,
      })
      .select()
      .single<Conversation>();
    if (newConvo) convos = [newConvo];
  }

  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .in("conversation_id", convos.map((c) => c.id))
    .order("created_at", { ascending: true });

  const { data: deliverables } = await supabase
    .from("deliverables")
    .select("*")
    .eq("project_id", project.id)
    .order("created_at", { ascending: false });

  const template = getTemplate(project.business_type);

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="size-10 rounded-xl gradient-brand grid place-items-center shrink-0">
          <Brain className="size-5 text-white" />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold truncate">المساعد العام</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            اسأل Oji عن أيّ شيء — استراتيجيات، تصميمات، فيديو، أو محادثةٌ حرّة.
          </p>
        </div>
      </div>

      <ProjectWorkspace
        project={project}
        template={template}
        conversations={convos}
        initialMessages={(messages ?? []) as Message[]}
        initialDeliverables={(deliverables ?? []) as Deliverable[]}
      />
    </div>
  );
}
