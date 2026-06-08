"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Sparkles,
  Loader2,
  Copy,
  Save,
  Download,
  Eye,
  Paperclip,
  X,
  Image as ImageIcon,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { createClient } from "@/lib/supabase/client";

type ProjectOption = { id: string; name: string };

type Field = {
  name: string;
  label: string;
  type: "text" | "textarea" | "select" | "number";
  placeholder?: string;
  required?: boolean;
  rows?: number;
  options?: Array<{ label: string; value: string }>;
  defaultValue?: string;
};

export function GeneratorTool({
  tool,
  title,
  description,
  icon,
  fields = [],
  allowAttachments = false,
  allowProjectContext = true,
  outputType = "markdown",
  savedKind = "note",
  customPromptBuilder,
}: {
  tool: string;
  title: string;
  description: string;
  icon?: React.ReactNode;
  fields?: Field[];
  allowAttachments?: boolean;
  allowProjectContext?: boolean;
  outputType?: "markdown" | "html";
  savedKind?: string;
  /** يسمح ببناء برومبت مخصّص من قيم الحقول */
  customPromptBuilder?: (values: Record<string, string>) => string;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [attachments, setAttachments] = useState<Array<{ id: string; name: string; type: string; base64: string; previewUrl: string }>>([]);
  const [projectId, setProjectId] = useState<string>("");
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // تحميل المشاريع
  useEffect(() => {
    if (!allowProjectContext) return;
    (async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("projects")
        .select("id, name")
        .order("updated_at", { ascending: false });
      setProjects((data as ProjectOption[]) || []);
    })();
  }, [allowProjectContext]);

  // قيم افتراضية للحقول
  useEffect(() => {
    const defaults: Record<string, string> = {};
    for (const f of fields) {
      if (f.defaultValue) defaults[f.name] = f.defaultValue;
    }
    setValues((p) => ({ ...defaults, ...p }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleFileUpload(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    if (attachments.length + fileList.length > 3) {
      toast.error("الحدّ الأقصى 3 صور");
      return;
    }
    for (const file of Array.from(fileList)) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} أكبر من 5MB`);
        continue;
      }
      if (!file.type.startsWith("image/")) continue;
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(",")[1] || "";
        setAttachments((p) => [
          ...p,
          {
            id: `${Date.now()}-${Math.random()}`,
            name: file.name,
            type: file.type,
            base64,
            previewUrl: URL.createObjectURL(file),
          },
        ]);
      };
      reader.readAsDataURL(file);
    }
  }

  async function generate() {
    // تحقّق من الحقول المطلوبة
    for (const f of fields) {
      if (f.required && !values[f.name]?.trim()) {
        toast.error(`الحقل "${f.label}" مطلوب`);
        return;
      }
    }

    const promptText = customPromptBuilder
      ? customPromptBuilder(values)
      : Object.entries(values)
          .filter(([, v]) => v?.trim())
          .map(([k, v]) => {
            const field = fields.find((f) => f.name === k);
            return `**${field?.label || k}**: ${v}`;
          })
          .join("\n");

    setLoading(true);
    setResult("");
    setShowPreview(false);

    try {
      const res = await fetch("/api/generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool,
          input: promptText,
          project_id: projectId || undefined,
          attachments: attachments.length > 0
            ? attachments.map((a) => ({ type: a.type, base64: a.base64 }))
            : undefined,
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

  function extractHtml(text: string): string {
    const m = text.match(/```html\n?([\s\S]+?)```/);
    return m ? m[1] : text;
  }

  function copyResult() {
    navigator.clipboard.writeText(outputType === "html" ? extractHtml(result) : result);
    toast.success("تمّ النسخ");
  }

  function downloadAs(format: "html" | "txt" | "md") {
    const content = format === "html" ? extractHtml(result) : result;
    const mime =
      format === "html" ? "text/html;charset=utf-8" : "text/plain;charset=utf-8";
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title}-${Date.now()}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function saveToLibrary() {
    if (!projectId) {
      toast.error("اختر مشروعاً أولاً لحفظ النتيجة فيه");
      return;
    }
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("deliverables").insert({
      project_id: projectId,
      user_id: user.id,
      kind: savedKind,
      title: `${title} — ${new Date().toLocaleDateString("ar")}`,
      content: result,
    });
    if (error) {
      toast.error("حدثت مشكلة", { description: error.message });
      return;
    }
    toast.success("اتحفظ في مكتبة المشروع 📚");
  }

  function previewHtml() {
    const html = extractHtml(result);
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        {icon && (
          <div className="size-12 rounded-xl bg-primary/10 grid place-items-center text-primary shrink-0">
            {icon}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-muted-foreground mt-1">{description}</p>
        </div>
      </div>

      <Card className="p-5 space-y-4">
        {allowProjectContext && projects.length > 0 && (
          <div>
            <Label htmlFor="proj">المشروع (يضيف سياقاً للنتيجة)</Label>
            <select
              id="proj"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
            >
              <option value="">— بدون مشروع —</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        )}

        {fields.map((f) => (
          <div key={f.name}>
            <Label htmlFor={f.name}>
              {f.label} {f.required && <span className="text-destructive">*</span>}
            </Label>
            {f.type === "textarea" ? (
              <Textarea
                id={f.name}
                value={values[f.name] || ""}
                onChange={(e) => setValues((p) => ({ ...p, [f.name]: e.target.value }))}
                placeholder={f.placeholder}
                rows={f.rows || 4}
                className="mt-1"
              />
            ) : f.type === "select" ? (
              <select
                id={f.name}
                value={values[f.name] || ""}
                onChange={(e) => setValues((p) => ({ ...p, [f.name]: e.target.value }))}
                className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="">— اختر —</option>
                {f.options?.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            ) : (
              <Input
                id={f.name}
                type={f.type === "number" ? "number" : "text"}
                value={values[f.name] || ""}
                onChange={(e) => setValues((p) => ({ ...p, [f.name]: e.target.value }))}
                placeholder={f.placeholder}
                className="mt-1"
              />
            )}
          </div>
        ))}

        {allowAttachments && (
          <div>
            <Label>صور مرفقة (اختياري، حتى 3)</Label>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {attachments.map((a) => (
                <div key={a.id} className="relative group size-20 rounded-lg overflow-hidden border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={a.previewUrl} alt={a.name} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setAttachments((p) => p.filter((x) => x.id !== a.id))}
                    className="absolute top-1 right-1 size-5 rounded-full bg-destructive text-white grid place-items-center opacity-0 group-hover:opacity-100"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ))}
              {attachments.length < 3 && (
                <label className="size-20 rounded-lg border-2 border-dashed grid place-items-center cursor-pointer hover:border-primary">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFileUpload(e.target.files)}
                  />
                  <Paperclip className="size-5 text-muted-foreground" />
                </label>
              )}
            </div>
          </div>
        )}

        <Button onClick={generate} disabled={loading} variant="gradient" className="w-full" size="lg">
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          {loading ? "جاري التوليد..." : "توليد"}
        </Button>
      </Card>

      {(result || loading) && (
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="size-5 text-primary" />
              <h3 className="font-semibold">النتيجة</h3>
            </div>
            {result && !loading && (
              <div className="flex gap-1">
                {outputType === "html" && (
                  <>
                    <Button variant="outline" size="sm" onClick={previewHtml}>
                      <Eye className="size-3" /> معاينة
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => downloadAs("html")}>
                      <Download className="size-3" /> HTML
                    </Button>
                  </>
                )}
                {outputType === "markdown" && (
                  <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)}>
                    <ImageIcon className="size-3" /> {showPreview ? "كود" : "معاينة"}
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={copyResult}>
                  <Copy className="size-3" /> نسخ
                </Button>
                {projectId && (
                  <Button variant="gradient" size="sm" onClick={saveToLibrary}>
                    <Save className="size-3" /> حفظ
                  </Button>
                )}
              </div>
            )}
          </div>

          {loading && !result && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
              <Loader2 className="size-4 animate-spin" />
              Oji يفكّر...
            </div>
          )}

          {result && (
            <div className="max-h-[600px] overflow-y-auto">
              {outputType === "html" && !showPreview ? (
                <pre className="text-xs bg-muted/50 p-3 rounded-md whitespace-pre-wrap overflow-x-auto">
                  {result}
                </pre>
              ) : (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{result}</ReactMarkdown>
                </div>
              )}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
