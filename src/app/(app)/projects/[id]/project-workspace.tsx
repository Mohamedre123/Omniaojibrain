"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { ChatPanel } from "./chat-panel";
import { DeliverablesPanel } from "./deliverables-panel";
import { ShareToggle } from "./share-toggle";
import { MODE_LABELS, type WorkflowMode } from "@/lib/ai/prompts";
import type { BusinessTemplate } from "@/lib/templates";
import type { Project, Conversation, Message, Deliverable } from "@/types/db";
import { Folder, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function ProjectWorkspace({
  project,
  template,
  conversations,
  initialMessages,
  initialDeliverables,
}: {
  project: Project;
  template: BusinessTemplate;
  conversations: Conversation[];
  initialMessages: Message[];
  initialDeliverables: Deliverable[];
}) {
  const router = useRouter();
  const [convos, setConvos] = useState(conversations);
  const [activeMode, setActiveMode] = useState<WorkflowMode>(
    (conversations[0]?.mode as WorkflowMode) ?? "chat"
  );
  const [deliverables, setDeliverables] = useState(initialDeliverables);

  // ابحث عن conversation للوضع الحالي، أو خلق واحد
  async function getOrCreateConversation(mode: WorkflowMode): Promise<Conversation | null> {
    const existing = convos.find((c) => c.mode === mode);
    if (existing) return existing;

    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project_id: project.id, mode }),
    });
    if (!res.ok) {
      toast.error("تعذّر إنشاءُ المحادثة");
      return null;
    }
    const newConvo = (await res.json()) as Conversation;
    setConvos((p) => [...p, newConvo]);
    return newConvo;
  }

  const messagesByConvo = useMemo(() => {
    const map = new Map<string, Message[]>();
    for (const m of initialMessages) {
      const arr = map.get(m.conversation_id) ?? [];
      arr.push(m);
      map.set(m.conversation_id, arr);
    }
    return map;
  }, [initialMessages]);

  async function handleModeChange(newMode: string) {
    const mode = newMode as WorkflowMode;
    setActiveMode(mode);
    await getOrCreateConversation(mode);
  }

  async function saveAsDeliverable(payload: { kind: Deliverable["kind"]; title: string; content: string }) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("deliverables")
      .insert({
        project_id: project.id,
        user_id: user.id,
        kind: payload.kind,
        title: payload.title,
        content: payload.content,
      })
      .select()
      .single();
    if (error) {
      toast.error("حدثت مشكلة", { description: error.message });
      return;
    }
    setDeliverables((p) => [data as Deliverable, ...p]);
    toast.success("تمّ الحفظُ في مكتبةِ المشروع 📚");
  }

  function removeDeliverable(id: string) {
    setDeliverables((p) => p.filter((d) => d.id !== id));
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="min-w-0">
        <Card className="overflow-hidden">
          <div className="border-b p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="text-3xl">{template.emoji}</div>
              <div className="min-w-0">
                <h1 className="font-bold text-lg truncate">{project.name}</h1>
                <p className="text-xs text-muted-foreground">{template.name}</p>
              </div>
            </div>
            <ShareToggle project={project} onUpdate={() => router.refresh()} />
          </div>

          <Tabs value={activeMode} onValueChange={handleModeChange} className="p-4">
            <TabsList className="w-full h-auto p-1 grid grid-cols-4 gap-1">
              {(Object.keys(MODE_LABELS) as WorkflowMode[]).map((m) => (
                <TabsTrigger key={m} value={m} className="flex flex-col items-center gap-1 h-auto py-2 text-xs">
                  <span className="text-base">{MODE_LABELS[m].emoji}</span>
                  <span>{MODE_LABELS[m].label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {(Object.keys(MODE_LABELS) as WorkflowMode[]).map((m) => {
              const convo = convos.find((c) => c.mode === m);
              return (
                <TabsContent key={m} value={m} className="mt-4">
                  <div className="mb-3 px-1 text-sm text-muted-foreground flex items-center gap-2">
                    <Sparkles className="size-4 text-primary" />
                    {MODE_LABELS[m].description}
                  </div>
                  {convo ? (
                    <ChatPanel
                      conversation={convo}
                      mode={m}
                      template={template}
                      initialMessages={messagesByConvo.get(convo.id) ?? []}
                      brief={project.brief}
                      onSaveDeliverable={saveAsDeliverable}
                    />
                  ) : (
                    <div className="text-center py-10 text-muted-foreground text-sm">
                      جاري تهيئةُ المحادثة...
                    </div>
                  )}
                </TabsContent>
              );
            })}
          </Tabs>
        </Card>
      </div>

      <aside className="space-y-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3 text-sm font-semibold">
            <Folder className="size-4 text-primary" />
            مكتبةُ المشروع
            <span className="ml-auto text-xs text-muted-foreground">{deliverables.length}</span>
          </div>
          <DeliverablesPanel
            projectName={project.name}
            deliverables={deliverables}
            onDelete={removeDeliverable}
          />
        </Card>

        {project.brief && (
          <Card className="p-4">
            <div className="text-sm font-semibold mb-2">وصفُ المشروع</div>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{project.brief}</p>
          </Card>
        )}
      </aside>
    </div>
  );
}
