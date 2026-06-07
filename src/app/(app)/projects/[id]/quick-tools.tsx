"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Hash, Lightbulb, Shuffle, FileText, Layout, Loader2, Copy, Save, Download } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Project, Deliverable } from "@/types/db";

type ToolKey = "hashtags" | "content_ideas" | "variations" | "lead_magnet" | "landing_page";

type SaveFn = (payload: { kind: Deliverable["kind"]; title: string; content: string }) => Promise<void>;

const TOOLS: Array<{
  key: ToolKey;
  label: string;
  icon: typeof Hash;
  description: string;
  inputLabel: string;
  inputPlaceholder: string;
  needsInput: boolean;
  inputType?: "textarea" | "input";
}> = [
  {
    key: "hashtags",
    label: "هاشتاجات ذكية",
    icon: Hash,
    description: "30 هاشتاج مقسّمة بحسب الحجم والمجال",
    inputLabel: "ما الموضوع/المنشور؟ (اختياري)",
    inputPlaceholder: "مثلاً: إعلان وجبة جديدة في المطعم",
    needsInput: false,
    inputType: "input",
  },
  {
    key: "content_ideas",
    label: "أفكار محتوى",
    icon: Lightbulb,
    description: "15 فكرة منشور موزّعة (تعليمية / ترفيهية / ترويجية)",
    inputLabel: "تركيز خاص؟ (اختياري)",
    inputPlaceholder: "مثلاً: محتوى لشهر رمضان",
    needsInput: false,
    inputType: "input",
  },
  {
    key: "variations",
    label: "صياغات بديلة",
    icon: Shuffle,
    description: "5 نسخ من نفس النصّ بأساليبَ مختلفة",
    inputLabel: "النصّ الأصلي",
    inputPlaceholder: "الصق نصك هنا...",
    needsInput: true,
    inputType: "textarea",
  },
  {
    key: "lead_magnet",
    label: "مولّد Lead Magnet",
    icon: FileText,
    description: "كتيّب PDF احترافي يجذب عملاء جدد",
    inputLabel: "ما المشكلة التي يحلّها الكتيّب؟",
    inputPlaceholder: "مثلاً: دليل اختيار أفضل خطّةِ تسويق للمطاعم",
    needsInput: true,
    inputType: "input",
  },
  {
    key: "landing_page",
    label: "Landing Page",
    icon: Layout,
    description: "صفحة هبوط HTML كاملة، جاهزة للنشر",
    inputLabel: "ما العرض/المنتج؟",
    inputPlaceholder: "مثلاً: عرض افتتاح المطعم — وجبة مجانية",
    needsInput: true,
    inputType: "input",
  },
];

export function QuickTools({
  project,
  onSaveDeliverable,
}: {
  project: Project;
  onSaveDeliverable: SaveFn;
}) {
  const [activeTool, setActiveTool] = useState<ToolKey | null>(null);

  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        {TOOLS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTool(t.key)}
            className="text-right p-2.5 rounded-lg border bg-card hover:border-primary/40 hover:bg-accent/30 transition-all"
          >
            <div className="flex items-center gap-2 mb-1">
              <t.icon className="size-4 text-primary" />
              <div className="font-medium text-xs">{t.label}</div>
            </div>
            <div className="text-[10px] text-muted-foreground leading-snug">{t.description}</div>
          </button>
        ))}
      </div>

      {activeTool && (
        <ToolDialog
          tool={TOOLS.find((t) => t.key === activeTool)!}
          project={project}
          onClose={() => setActiveTool(null)}
          onSaveDeliverable={onSaveDeliverable}
        />
      )}
    </>
  );
}

function ToolDialog({
  tool,
  project,
  onClose,
  onSaveDeliverable,
}: {
  tool: (typeof TOOLS)[number];
  project: Project;
  onClose: () => void;
  onSaveDeliverable: SaveFn;
}) {
  const [input, setInput] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  async function run() {
    if (tool.needsInput && !input.trim()) {
      toast.error("اكتب المدخل أولاً");
      return;
    }

    setLoading(true);
    setResult("");

    try {
      const res = await fetch("/api/quick-tool", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: tool.key,
          input: input.trim(),
          project_id: project.id,
        }),
      });

      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({ error: "حدثت مشكلة" }));
        toast.error(err.error ?? "حدثت مشكلة");
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
        setResult(acc);
      }
    } catch {
      toast.error("تعذّر الاتصال");
    } finally {
      setLoading(false);
    }
  }

  function copyResult() {
    navigator.clipboard.writeText(result);
    toast.success("تمّ النسخ");
  }

  async function saveResult() {
    const kindMap: Record<ToolKey, Deliverable["kind"]> = {
      hashtags: "note",
      content_ideas: "note",
      variations: "note",
      lead_magnet: "script",
      landing_page: "script",
    };
    await onSaveDeliverable({
      kind: kindMap[tool.key],
      title: `${tool.label} — ${new Date().toLocaleDateString("ar")}`,
      content: result,
    });
  }

  function downloadHtml() {
    // استخرج HTML من ```html block``` لو موجود
    const htmlMatch = result.match(/```html\n?([\s\S]+?)```/);
    const html = htmlMatch ? htmlMatch[1] : result;
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${tool.label}-${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Dialog open={true} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <tool.icon className="size-5 text-primary" />
            {tool.label}
          </DialogTitle>
          <DialogDescription>{tool.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="tool-input">{tool.inputLabel}</Label>
            {tool.inputType === "textarea" ? (
              <Textarea
                id="tool-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={tool.inputPlaceholder}
                rows={4}
                className="mt-2"
              />
            ) : (
              <Input
                id="tool-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={tool.inputPlaceholder}
                className="mt-2"
              />
            )}
          </div>

          <Button onClick={run} disabled={loading} variant="gradient" className="w-full">
            {loading && <Loader2 className="size-4 animate-spin" />}
            توليد
          </Button>

          {result && (
            <div className="space-y-3">
              <div className="border rounded-lg p-4 bg-muted/30">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{result}</ReactMarkdown>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={copyResult}>
                  <Copy className="size-3" /> نسخ
                </Button>
                {tool.key === "landing_page" && (
                  <Button variant="outline" size="sm" onClick={downloadHtml}>
                    <Download className="size-3" /> تنزيل HTML
                  </Button>
                )}
                <Button variant="gradient" size="sm" onClick={saveResult}>
                  <Save className="size-3" /> حفظ في المكتبة
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
