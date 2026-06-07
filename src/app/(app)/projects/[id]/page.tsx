import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getTemplate } from "@/lib/templates";
import { ProjectWorkspace } from "./project-workspace";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import type { Conversation, Message, Project, Deliverable } from "@/types/db";

export default async function ProjectPage({
  params,
}: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single<Project>();

  if (!project) notFound();

  const { data: conversations } = await supabase
    .from("conversations")
    .select("*")
    .eq("project_id", id)
    .order("created_at", { ascending: true });

  let convos = (conversations ?? []) as Conversation[];

  // لو مفيش conversations نخلق واحد افتراضي
  if (convos.length === 0) {
    const { data: newConvo } = await supabase
      .from("conversations")
      .insert({
        project_id: id,
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
    .eq("project_id", id)
    .order("created_at", { ascending: false });

  const template = getTemplate(project.business_type);

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-5 flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard">
            <ArrowRight className="size-4" />
            العودة إلى المشاريع
          </Link>
        </Button>
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
