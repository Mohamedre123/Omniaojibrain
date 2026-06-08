"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Mail } from "lucide-react";
import { GeneratorTool } from "@/components/generator-tool";

export default function EmailPage() {
  const [mode, setMode] = useState<"single" | "sequence">("single");

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card className="p-1 mb-6 inline-flex">
        <button
          onClick={() => setMode("single")}
          className={`px-4 py-2 rounded-md text-sm ${mode === "single" ? "bg-primary text-primary-foreground" : ""}`}
        >
          إيميل واحد
        </button>
        <button
          onClick={() => setMode("sequence")}
          className={`px-4 py-2 rounded-md text-sm ${mode === "sequence" ? "bg-primary text-primary-foreground" : ""}`}
        >
          سلسلة 5 إيميلات
        </button>
      </Card>

      {mode === "single" ? (
        <GeneratorTool
          tool="email_template"
          title="قالب Email Marketing"
          description="إيميل HTML احترافي بألوان علامتك"
          icon={<Mail className="size-6" />}
          savedKind="email_template"
          outputType="html"
          fields={[
            { name: "purpose", label: "الغرض من الإيميل", type: "select", defaultValue: "promotion", options: [
              { label: "ترويج لمنتج", value: "promotion" },
              { label: "إعلان عرض", value: "offer" },
              { label: "Newsletter", value: "newsletter" },
              { label: "تذكير", value: "reminder" },
              { label: "شكر", value: "thanks" },
            ]},
            { name: "subject", label: "موضوع الإيميل المقترح", type: "text", required: true },
            { name: "body", label: "المحتوى الأساسي", type: "textarea", rows: 4, required: true },
            { name: "cta", label: "زرّ Call to Action", type: "text", placeholder: "اطلب الآن" },
            { name: "ctaUrl", label: "رابط الزرّ", type: "text", placeholder: "https://..." },
          ]}
        />
      ) : (
        <GeneratorTool
          tool="email_sequence"
          title="سلسلة Email Sequence"
          description="5 إيميلات بترتيب زمني (Welcome → Engage → Educate → Promote → Win-back)"
          icon={<Mail className="size-6" />}
          savedKind="email_template"
          outputType="markdown"
          fields={[
            { name: "audience", label: "الجمهور المستهدف", type: "text", required: true },
            { name: "product", label: "المنتج / الخدمة", type: "text", required: true },
            { name: "interval", label: "الفاصل الزمني", type: "select", defaultValue: "weekly", options: [
              { label: "يومي", value: "daily" },
              { label: "كل 3 أيام", value: "3days" },
              { label: "أسبوعي", value: "weekly" },
            ]},
          ]}
        />
      )}
    </div>
  );
}
