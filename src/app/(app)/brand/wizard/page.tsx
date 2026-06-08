"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Wand2, Loader2, ChevronLeft, ChevronRight, Sparkles, Copy, Save } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { createClient } from "@/lib/supabase/client";

type Q = { name: string; label: string; placeholder: string; rows?: number; required?: boolean };

const QUESTIONS: Q[] = [
  { name: "name", label: "اسم العلامة (أو اقتراح)", placeholder: "Oji Brain أو اقتراح إن لم تختر بعد", required: true },
  { name: "industry", label: "ما القطاع الذي تعمل فيه؟", placeholder: "مطعم / موضة / تقنية / تعليم...", required: true },
  { name: "audience", label: "من جمهورك المثالي؟", placeholder: "وصف ديموغرافي + اهتمامات", required: true, rows: 3 },
  { name: "problem", label: "ما المشكلة التي تحلّها؟", placeholder: "...", rows: 3 },
  { name: "unique", label: "ما الذي يميّزك عن المنافسين؟", placeholder: "...", rows: 3 },
  { name: "vision", label: "رؤيتك بعد 5 سنوات؟", placeholder: "...", rows: 2 },
  { name: "values", label: "3 قيم جوهرية لعلامتك", placeholder: "الجودة، الشفافية، الإبداع..." },
  { name: "tone", label: "نبرة العلامة المفضّلة", placeholder: "مرحة وودودة / فاخرة وراقية / احترافية" },
  { name: "colors", label: "ألوان تحبها أو موجودة بالفعل (اختياري)", placeholder: "#7c3aed, #d946ef" },
  { name: "inspirations", label: "علامات تجارية تُلهمك (اختياري)", placeholder: "Apple, Nike, Patagonia..." },
];

export default function BrandWizardPage() {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  const isLast = step === QUESTIONS.length - 1;
  const progress = ((step + 1) / QUESTIONS.length) * 100;
  const current = QUESTIONS[step];

  function next() {
    if (current.required && !values[current.name]?.trim()) {
      toast.error("هذا الحقل مطلوب");
      return;
    }
    if (!isLast) setStep(step + 1);
    else void generate();
  }

  function prev() {
    if (step > 0) setStep(step - 1);
  }

  async function generate() {
    const input = QUESTIONS.map((q) => `**${q.label}**: ${values[q.name] || "—"}`).join("\n");

    setLoading(true);
    setResult("");

    try {
      const res = await fetch("/api/generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool: "brand_kit", input }),
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

  function copy() {
    navigator.clipboard.writeText(result);
    toast.success("تمّ النسخ");
  }

  async function saveAsBrandMemory() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("profiles").upsert({
      id: user.id,
      brand_name: values.name,
      brand_voice: values.tone,
      brand_colors: values.colors ? values.colors.split(/[,\s]+/).filter(c => c.startsWith("#")) : [],
      updated_at: new Date().toISOString(),
    });
    toast.success("اتحفظت في Brand Memory ✓");
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <Wand2 className="size-7 text-primary" />
          Brand Identity Wizard
        </h1>
        <p className="text-muted-foreground mt-2">10 أسئلة → كتاب علامة كامل</p>
      </div>

      {!result && !loading && (
        <Card className="p-6">
          {/* Progress */}
          <div className="mb-6">
            <div className="flex justify-between text-xs text-muted-foreground mb-2">
              <span>السؤال {step + 1} من {QUESTIONS.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full gradient-brand transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="space-y-4">
            <Label className="text-base">{current.label}</Label>
            {current.rows ? (
              <Textarea
                value={values[current.name] || ""}
                onChange={(e) => setValues({ ...values, [current.name]: e.target.value })}
                placeholder={current.placeholder}
                rows={current.rows}
                autoFocus
              />
            ) : (
              <Input
                value={values[current.name] || ""}
                onChange={(e) => setValues({ ...values, [current.name]: e.target.value })}
                placeholder={current.placeholder}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    next();
                  }
                }}
              />
            )}
          </div>

          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={prev} disabled={step === 0}>
              <ChevronRight className="size-4" /> السابق
            </Button>
            <Button variant="gradient" onClick={next}>
              {isLast ? <><Sparkles className="size-4" /> توليد Brand Kit</> : <>التالي <ChevronLeft className="size-4" /></>}
            </Button>
          </div>
        </Card>
      )}

      {loading && (
        <Card className="p-10 text-center">
          <Loader2 className="size-10 animate-spin mx-auto text-primary mb-3" />
          <h3 className="font-semibold">Oji يبني علامتك التجارية...</h3>
          <p className="text-sm text-muted-foreground mt-1">قد يستغرق 30 ثانية</p>
        </Card>
      )}

      {result && (
        <Card className="p-6">
          <div className="flex items-center justify-between border-b pb-3 mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Sparkles className="size-5 text-primary" />
              Brand Kit الخاصّ بك
            </h3>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" onClick={copy}>
                <Copy className="size-3" /> نسخ
              </Button>
              <Button variant="gradient" size="sm" onClick={saveAsBrandMemory}>
                <Save className="size-3" /> حفظ في Brand Memory
              </Button>
            </div>
          </div>
          <div className="prose prose-sm dark:prose-invert max-w-none max-h-[600px] overflow-y-auto">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{result}</ReactMarkdown>
          </div>
        </Card>
      )}
    </div>
  );
}
