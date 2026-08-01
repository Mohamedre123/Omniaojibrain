import { GeneratorTool } from "@/components/generator-tool";
import { Brain } from "lucide-react";

export default function TodayPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <GeneratorTool
        tool="daily_actions"
        title="أعمل إيه النهارده؟"
        description="اختر مشروعك → Oji يقترح 3–5 مهام محتوى جاهزة للتنفيذ اليوم مع الأداة المناسبة لكل مهمة"
        icon={<Brain className="size-6" />}
        savedKind="strategy"
        fields={[
          { name: "focus", label: "تركيز معيّن؟ (اختياري)", type: "text", required: false, placeholder: "مثلاً: زيادة المبيعات، إطلاق منتج، تفاعل" },
        ]}
      />
    </div>
  );
}
