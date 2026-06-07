import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getTemplate } from "@/lib/templates";
import { Brain, FileText, Target, Palette, Video, StickyNote } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Project, Deliverable } from "@/types/db";

const KIND_ICON = {
  strategy: Target,
  design_prompt: Palette,
  video_prompt: Video,
  script: FileText,
  note: StickyNote,
};

export default async function SharedProjectPage({
  params,
}: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("share_token", token)
    .eq("is_shared", true)
    .single<Project>();

  if (!project) notFound();

  const { data: deliverables } = await supabase
    .from("deliverables")
    .select("*")
    .eq("project_id", project.id)
    .order("created_at", { ascending: false });

  const template = getTemplate(project.business_type);
  const list = (deliverables ?? []) as Deliverable[];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto h-16 px-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="size-9 rounded-lg gradient-brand grid place-items-center">
              <Brain className="size-5 text-white" />
            </div>
            <span className="text-xl font-bold">Oji Brain</span>
          </Link>
          <Button asChild variant="gradient" size="sm">
            <Link href="/signup">جرّبهُ مجاناً</Link>
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-10 max-w-4xl">
        <div className="text-center mb-10">
          <div className="text-6xl mb-3">{template.emoji}</div>
          <h1 className="text-3xl font-bold">{project.name}</h1>
          <p className="text-muted-foreground mt-2">{template.name}</p>
        </div>

        {project.brief && (
          <Card className="p-6 mb-6 bg-accent/30">
            <h2 className="font-semibold mb-2">عن المشروع</h2>
            <p className="whitespace-pre-wrap leading-relaxed text-sm">{project.brief}</p>
          </Card>
        )}

        {list.length === 0 ? (
          <Card className="p-10 text-center text-muted-foreground">
            لا توجد مخرجاتٌ منشورةٌ بعد.
          </Card>
        ) : (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">المخرجات</h2>
            {list.map((d) => {
              const Icon = KIND_ICON[d.kind];
              return (
                <Card key={d.id} className="p-6">
                  <div className="flex items-center gap-3 mb-4 pb-3 border-b">
                    <div className="size-10 rounded-lg bg-primary/10 grid place-items-center text-primary">
                      <Icon className="size-5" />
                    </div>
                    <h3 className="font-semibold text-lg">{d.title}</h3>
                  </div>
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{d.content}</ReactMarkdown>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        <div className="text-center mt-10 text-xs text-muted-foreground">
          أُنشئ بواسطة <span className="font-semibold text-foreground">Oji Brain</span> ✨
        </div>
      </div>
    </div>
  );
}
