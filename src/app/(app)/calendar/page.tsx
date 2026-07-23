"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Sparkles, Loader2, ChevronRight, ChevronLeft, Copy, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Project = { id: string; name: string };
type CalendarEvent = {
  day: number;
  type: string;
  title: string;
  caption: string;
  platform: string;
  cta: string;
};

const TYPE_COLORS: Record<string, string> = {
  educational: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  entertaining: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  promotional: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
  community: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
};

export default function CalendarPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState<string>("");
  const [month, setMonth] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<CalendarEvent | null>(null);

  const storageKey = (pid: string, m: Date) =>
    `oji_calendar_${pid}_${m.getFullYear()}_${m.getMonth()}`;

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("projects")
        .select("id, name")
        .order("updated_at", { ascending: false });
      setProjects((data as Project[]) || []);
    })();
  }, []);

  // استرجاع تقويم محفوظ لهذا المشروع/الشهر
  useEffect(() => {
    if (!projectId) {
      setEvents([]);
      return;
    }
    try {
      const raw = localStorage.getItem(storageKey(projectId, month));
      setEvents(raw ? (JSON.parse(raw) as CalendarEvent[]) : []);
    } catch {
      setEvents([]);
    }
  }, [projectId, month]);

  function copyPost(e: CalendarEvent) {
    const text = `${e.title}\n\n${e.caption}${e.cta ? `\n\n${e.cta}` : ""}`;
    navigator.clipboard.writeText(text);
    toast.success("تمّ نسخ المنشور");
  }

  async function generate() {
    if (!projectId) {
      toast.error("اختر مشروعاً أولاً");
      return;
    }
    setLoading(true);
    setEvents([]);

    try {
      const res = await fetch("/api/generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: "content_calendar",
          input: `**شهر**: ${month.toLocaleDateString("ar", { month: "long", year: "numeric" })}`,
          project_id: projectId,
        }),
      });

      if (!res.ok || !res.body) {
        toast.error("حدثت مشكلة");
        setLoading(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
      }

      // استخرج JSON من الرد
      const match = acc.match(/\[[\s\S]*\]/);
      if (match) {
        try {
          const parsed = JSON.parse(match[0]) as CalendarEvent[];
          setEvents(parsed);
          try {
            localStorage.setItem(storageKey(projectId, month), JSON.stringify(parsed));
          } catch {
            /* تجاوز حدّ التخزين */
          }
          toast.success(`تمّ توليد ${parsed.length} منشور — محفوظ تلقائياً`);
        } catch {
          toast.error("لم نستطع تحليل النتيجة");
        }
      } else {
        toast.error("الـ AI لم يرجع تقويم صحيح");
      }
    } catch {
      toast.error("تعذّر الاتصال");
    } finally {
      setLoading(false);
    }
  }

  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1).getDay();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <CalendarIcon className="size-7 text-primary" />
          Content Calendar
        </h1>
        <p className="text-muted-foreground mt-2">
          تقويم محتوًى شهريّ بـ 30 منشور موزّعة على الأيام
        </p>
      </div>

      <Card className="p-5 mb-6 flex flex-wrap items-center gap-3">
        <select
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          className="h-10 px-3 rounded-md border border-input bg-background text-sm flex-1 min-w-[200px]"
        >
          <option value="">— اختر مشروعاً —</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1))}>
            <ChevronRight className="size-4" />
          </Button>
          <span className="text-sm font-medium min-w-[120px] text-center">
            {month.toLocaleDateString("ar", { month: "long", year: "numeric" })}
          </span>
          <Button variant="outline" size="sm" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1))}>
            <ChevronLeft className="size-4" />
          </Button>
        </div>

        <Button variant="gradient" onClick={generate} disabled={loading || !projectId}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          توليد تقويم
        </Button>
      </Card>

      {events.length > 0 && (
        <Card className="p-3 md:p-5 overflow-x-auto">
          <div className="grid grid-cols-7 gap-1 md:gap-2 min-w-[500px]">
            {["أحد", "إثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"].map((d) => (
              <div key={d} className="text-center text-xs font-semibold text-muted-foreground p-2">{d}</div>
            ))}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const event = events.find((e) => e.day === day);
              return (
                <div
                  key={day}
                  onClick={() => event && setSelected(event)}
                  className={`border rounded-md p-1.5 md:p-2 min-h-[80px] md:min-h-[100px] ${event ? "bg-card cursor-pointer hover:border-primary hover:shadow-sm transition-all" : "bg-muted/30"}`}
                >
                  <div className="text-xs font-semibold mb-1">{day}</div>
                  {event && (
                    <div className="space-y-1">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded ${TYPE_COLORS[event.type] || TYPE_COLORS.educational}`}>
                        {event.type}
                      </span>
                      <p className="text-[10px] line-clamp-2 font-medium">{event.title}</p>
                      <p className="text-[9px] text-muted-foreground line-clamp-2">{event.platform}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {events.length > 0 && (
        <p className="text-xs text-muted-foreground mt-3 text-center">
          اضغط على أي يوم لعرض المنشور كاملاً ونسخه · التقويم محفوظ تلقائياً لهذا المشروع والشهر
        </p>
      )}

      {!loading && events.length === 0 && (
        <Card className="p-12 text-center">
          <CalendarIcon className="size-12 mx-auto text-muted-foreground mb-3 opacity-50" />
          <h3 className="font-semibold">اختر مشروعاً ثم اضغط &quot;توليد تقويم&quot;</h3>
          <p className="text-sm text-muted-foreground mt-1">
            سيقوم Oji بإنتاج خطّة محتوى شهرية بناءً على بيانات مشروعك
          </p>
        </Card>
      )}

      {/* تفاصيل المنشور */}
      {selected && (
        <div
          className="fixed inset-0 z-50 bg-black/50 grid place-items-center p-4"
          onClick={() => setSelected(null)}
        >
          <Card className="w-full max-w-lg p-5 space-y-4 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold">اليوم {selected.day}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded ${TYPE_COLORS[selected.type] || TYPE_COLORS.educational}`}>
                  {selected.type}
                </span>
                {selected.platform && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-muted text-muted-foreground">{selected.platform}</span>
                )}
              </div>
              <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground">
                <X className="size-5" />
              </button>
            </div>

            <div>
              <h3 className="font-semibold text-lg">{selected.title}</h3>
            </div>

            {selected.caption && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">الكابشن</p>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{selected.caption}</p>
              </div>
            )}

            {selected.cta && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">دعوة للعمل (CTA)</p>
                <p className="text-sm font-medium text-primary">{selected.cta}</p>
              </div>
            )}

            <div className="flex gap-2 pt-2 border-t">
              <Button variant="gradient" size="sm" onClick={() => copyPost(selected)}>
                <Copy className="size-4" /> نسخ المنشور
              </Button>
              <Button variant="outline" size="sm" onClick={() => setSelected(null)}>
                إغلاق
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
