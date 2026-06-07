"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import { exportToPDF } from "@/lib/export";
import type { Deliverable } from "@/types/db";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Copy, Download, FileText, Target, Palette, Video, StickyNote, Trash2, Eye } from "lucide-react";
import { relativeTime } from "@/lib/utils";

const KIND_META: Record<Deliverable["kind"], { icon: typeof Target; label: string; color: string }> = {
  strategy: { icon: Target, label: "استراتيجية", color: "text-blue-600 bg-blue-50 dark:bg-blue-950/50" },
  design_prompt: { icon: Palette, label: "تصميم", color: "text-rose-600 bg-rose-50 dark:bg-rose-950/50" },
  video_prompt: { icon: Video, label: "فيديو", color: "text-purple-600 bg-purple-50 dark:bg-purple-950/50" },
  script: { icon: FileText, label: "سكربت", color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50" },
  note: { icon: StickyNote, label: "ملاحظة", color: "text-amber-600 bg-amber-50 dark:bg-amber-950/50" },
};

export function DeliverablesPanel({
  projectName,
  deliverables,
  onDelete,
}: {
  projectName: string;
  deliverables: Deliverable[];
  onDelete: (id: string) => void;
}) {
  const [viewing, setViewing] = useState<Deliverable | null>(null);

  async function deleteOne(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("deliverables").delete().eq("id", id);
    if (error) {
      toast.error("حدثت مشكلة", { description: error.message });
      return;
    }
    onDelete(id);
    toast.success("تمّ الحذف");
  }

  function copyContent(d: Deliverable) {
    navigator.clipboard.writeText(d.content);
    toast.success("تمّ النسخ");
  }

  function downloadAsTxt(d: Deliverable) {
    const blob = new Blob([d.content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${d.title}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function exportPDF(d: Deliverable) {
    try {
      await exportToPDF({ title: d.title, content: d.content, projectName });
    } catch {
      toast.error("تعذّر تصديرُ ملف PDF");
    }
  }

  if (deliverables.length === 0) {
    return (
      <div className="text-center py-6 text-xs text-muted-foreground">
        <p>لا يوجد محتوًى محفوظٌ بعد</p>
        <p className="mt-1 opacity-80">اضغط &quot;حفظ&quot; على أيّ ردٍّ لإضافته هنا</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2 max-h-[60vh] overflow-y-auto">
        {deliverables.map((d) => {
          const meta = KIND_META[d.kind];
          const Icon = meta.icon;
          return (
            <div key={d.id} className="group rounded-lg border p-3 hover:border-primary/40 transition-all">
              <div className="flex items-start gap-2">
                <div className={`shrink-0 size-8 rounded-md grid place-items-center ${meta.color}`}>
                  <Icon className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm line-clamp-1">{d.title}</p>
                  <p className="text-xs text-muted-foreground">{relativeTime(d.created_at)}</p>
                </div>
              </div>
              <div className="mt-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs flex-1" onClick={() => setViewing(d)}>
                  <Eye className="size-3" />
                </Button>
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs flex-1" onClick={() => copyContent(d)} title="نسخ">
                  <Copy className="size-3" />
                </Button>
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs flex-1" onClick={() => exportPDF(d)} title="تصدير PDF">
                  <Download className="size-3" />
                </Button>
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-destructive" onClick={() => deleteOne(d.id)} title="حذف">
                  <Trash2 className="size-3" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          {viewing && (
            <>
              <DialogHeader>
                <DialogTitle>{viewing.title}</DialogTitle>
              </DialogHeader>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{viewing.content}</ReactMarkdown>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => copyContent(viewing)}>
                  <Copy className="size-4" />
                  نسخ
                </Button>
                <Button variant="outline" size="sm" onClick={() => downloadAsTxt(viewing)}>
                  <Download className="size-4" />
                  تحميل نصّاً
                </Button>
                <Button variant="gradient" size="sm" onClick={() => exportPDF(viewing)}>
                  <Download className="size-4" />
                  تحميل PDF
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
