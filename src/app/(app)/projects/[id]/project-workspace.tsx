"use client";

import { useState, useEffect, useCallback } from "react";
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
import { Folder, Sparkles, RotateCcw, Wand2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { QuickTools } from "./quick-tools";

type MessagesMap = Record<string, Message[]>;

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

  // 💡 الـ Fix الأساسي: نخلي الرسائل State في الـ Workspace (مش في كل ChatPanel)
  // كده لما العميل يبدّل بين الأوضاع، الرسائل تفضل موجودة
  const [messagesByConvo, setMessagesByConvo] = useState<MessagesMap>(() => {
    const map: MessagesMap = {};
    for (const m of initialMessages) {
      if (!map[m.conversation_id]) map[m.conversation_id] = [];
      map[m.conversation_id].push(m);
    }
    return map;
  });

  // مزامنة دورية مع قاعدة البيانات (لو فتح تاب تاني للمشروع)
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`project-${project.id}-messages`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=in.(${convos.map((c) => c.id).join(",")})`,
        },
        (payload) => {
          const m = payload.new as Message;
          setMessagesByConvo((prev) => {
            const existing = prev[m.conversation_id] ?? [];
            // تجنّب التكرار لو الرسالة موجودة بالفعل (نضيفها محلياً قبل DB)
            if (existing.some((x) => x.id === m.id)) return prev;
            return { ...prev, [m.conversation_id]: [...existing, m] };
          });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [project.id, convos]);

  // إضافة رسالة للمحادثة (يستدعيها ChatPanel)
  const addMessage = useCallback((convoId: string, message: Message) => {
    setMessagesByConvo((prev) => {
      const existing = prev[convoId] ?? [];
      // تجنّب التكرار
      if (existing.some((x) => x.id === message.id)) return prev;
      return { ...prev, [convoId]: [...existing, message] };
    });
  }, []);

  // استبدال رسالة (لو الـ ID اتغيّر من temp لحقيقي)
  const replaceTempMessage = useCallback(
    (convoId: string, tempId: string, finalMessage: Message) => {
      setMessagesByConvo((prev) => {
        const existing = prev[convoId] ?? [];
        return {
          ...prev,
          [convoId]: existing.map((m) => (m.id === tempId ? finalMessage : m)),
        };
      });
    },
    []
  );

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

  async function handleModeChange(newMode: string) {
    const mode = newMode as WorkflowMode;
    setActiveMode(mode);
    await getOrCreateConversation(mode);
  }

  // إعادة تحميل من قاعدة البيانات (زر التحديث)
  async function refreshFromDb() {
    const supabase = createClient();
    const { data } = await supabase
      .from("messages")
      .select("*")
      .in("conversation_id", convos.map((c) => c.id))
      .order("created_at", { ascending: true });

    const map: MessagesMap = {};
    for (const m of (data ?? []) as Message[]) {
      if (!map[m.conversation_id]) map[m.conversation_id] = [];
      map[m.conversation_id].push(m);
    }
    setMessagesByConvo(map);
    toast.success("تمّ التحديث");
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

  // عدد الرسائل لكل وضع (يظهر بجانب اسم الـ Tab)
  function getMessageCount(mode: WorkflowMode): number {
    const convo = convos.find((c) => c.mode === mode);
    if (!convo) return 0;
    return (messagesByConvo[convo.id] ?? []).length;
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
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={refreshFromDb}
                title="تحديث من قاعدة البيانات"
                aria-label="تحديث"
              >
                <RotateCcw className="size-4" />
              </Button>
              <ShareToggle project={project} onUpdate={() => router.refresh()} />
            </div>
          </div>

          <Tabs value={activeMode} onValueChange={handleModeChange} className="p-4">
            <TabsList className="w-full h-auto p-1 grid grid-cols-3 md:grid-cols-5 gap-1">
              {(Object.keys(MODE_LABELS) as WorkflowMode[]).map((m) => {
                const count = getMessageCount(m);
                return (
                  <TabsTrigger key={m} value={m} className="flex flex-col items-center gap-1 h-auto py-2 text-xs relative">
                    <span className="text-base">{MODE_LABELS[m].emoji}</span>
                    <span>{MODE_LABELS[m].label}</span>
                    {count > 0 && (
                      <span className="absolute top-1 right-1 size-4 rounded-full bg-primary/15 text-primary text-[10px] font-semibold grid place-items-center">
                        {count > 9 ? "9+" : count}
                      </span>
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {(Object.keys(MODE_LABELS) as WorkflowMode[]).map((m) => {
              const convo = convos.find((c) => c.mode === m);
              return (
                <TabsContent key={m} value={m} className="mt-4" forceMount={true} hidden={activeMode !== m}>
                  <div className="mb-3 px-1 text-sm text-muted-foreground flex items-center gap-2">
                    <Sparkles className="size-4 text-primary" />
                    {MODE_LABELS[m].description}
                  </div>
                  {convo ? (
                    <ChatPanel
                      conversation={convo}
                      mode={m}
                      template={template}
                      messages={messagesByConvo[convo.id] ?? []}
                      brief={project.brief}
                      onAddMessage={(msg) => addMessage(convo.id, msg)}
                      onReplaceMessage={(tempId, msg) => replaceTempMessage(convo.id, tempId, msg)}
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
            <Wand2 className="size-4 text-primary" />
            أدواتٌ سريعة
          </div>
          <QuickTools project={project} onSaveDeliverable={saveAsDeliverable} />
        </Card>

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
