"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LineChart, Loader2, Sparkles, Copy } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const METRICS = [
  { name: "reach", label: "Reach (الوصول)", placeholder: "10000" },
  { name: "impressions", label: "Impressions (الظهور)", placeholder: "25000" },
  { name: "engagement", label: "Engagement (تفاعل)", placeholder: "1200" },
  { name: "followers", label: "Followers (متابعين)", placeholder: "5000" },
  { name: "follows_gained", label: "متابعين جدد", placeholder: "150" },
  { name: "saves", label: "Saves (حفظ)", placeholder: "80" },
  { name: "shares", label: "Shares (مشاركات)", placeholder: "45" },
  { name: "comments", label: "Comments", placeholder: "60" },
  { name: "profile_visits", label: "زيارات الملف الشخصي", placeholder: "500" },
  { name: "website_clicks", label: "نقرات الموقع", placeholder: "120" },
];

export default function PerformancePage() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [posts, setPosts] = useState("");
  const [period, setPeriod] = useState("7");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  async function analyze() {
    const nonEmpty = Object.entries(values).filter(([, v]) => v?.trim());
    if (nonEmpty.length === 0 && !posts.trim()) {
      toast.error("ادخل بيانات للتحليل");
      return;
    }

    const input = `**فترة التقرير**: آخر ${period} أيام

**الأرقام**:
${nonEmpty.map(([k, v]) => `- ${METRICS.find(m => m.name === k)?.label}: ${v}`).join("\n")}

${posts.trim() ? `\n**أفضل/أسوأ المنشورات**:\n${posts}` : ""}

**المطلوب**:
1. تحليل الأرقام (قويّة / متوسّطة / ضعيفة) مع المعايير الصناعية.
2. أهمّ 3 أرقام لازم العميل يهتمّ بها.
3. ما هو شغّال (Working).
4. ما يجب تحسينه (Improve).
5. خطّة محدّدة للأسبوع القادم.`;

    setLoading(true);
    setResult("");

    try {
      const res = await fetch("/api/generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool: "performance_analysis", input }),
      });
      if (!res.ok || !res.body) { toast.error("حدثت مشكلة"); setLoading(false); return; }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setResult(acc);
      }
    } catch { toast.error("تعذّر الاتصال"); }
    finally { setLoading(false); }
  }

  function copy() {
    navigator.clipboard.writeText(result);
    toast.success("تمّ النسخ");
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <LineChart className="size-7 text-primary" />
          تتبّع الأداء
        </h1>
        <p className="text-muted-foreground mt-2">
          ادخل أرقامك من Instagram Insights / Meta Business، يحلّل Oji ويوصّيك
        </p>
      </div>

      <Card className="p-5 space-y-4">
        <div>
          <Label>الفترة</Label>
          <select value={period} onChange={(e) => setPeriod(e.target.value)} className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
            <option value="7">آخر 7 أيام</option>
            <option value="30">آخر 30 يوم</option>
            <option value="90">آخر 90 يوم</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {METRICS.map((m) => (
            <div key={m.name}>
              <Label htmlFor={m.name} className="text-xs">{m.label}</Label>
              <Input
                id={m.name}
                value={values[m.name] || ""}
                onChange={(e) => setValues((p) => ({ ...p, [m.name]: e.target.value }))}
                placeholder={m.placeholder}
                className="mt-1"
              />
            </div>
          ))}
        </div>

        <div>
          <Label htmlFor="posts">أفضل/أسوأ منشورات (اختياري)</Label>
          <Textarea
            id="posts"
            value={posts}
            onChange={(e) => setPosts(e.target.value)}
            placeholder={"أفضل: Reel عن تحضير القهوة - 50K view\nأسوأ: صورة منتج - 200 view"}
            rows={4}
            className="mt-1"
          />
        </div>

        <Button onClick={analyze} disabled={loading} variant="gradient" size="lg" className="w-full">
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          تحليل الأداء
        </Button>
      </Card>

      {result && (
        <Card className="p-5 mt-4">
          <div className="flex justify-between items-center mb-3 pb-3 border-b">
            <h3 className="font-semibold">تحليل Oji</h3>
            <Button variant="outline" size="sm" onClick={copy}><Copy className="size-3" /> نسخ</Button>
          </div>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{result}</ReactMarkdown>
          </div>
        </Card>
      )}
    </div>
  );
}
