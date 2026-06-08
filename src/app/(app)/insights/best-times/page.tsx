import { GeneratorTool } from "@/components/generator-tool";
import { Clock } from "lucide-react";

export default function BestTimesPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <GeneratorTool
        tool="best_posting_times"
        title="أفضل أوقات النشر"
        description="جدول مواعيد نشر لكل منصّة بناءً على جمهورك"
        icon={<Clock className="size-6" />}
        savedKind="note"
        fields={[
          { name: "audience", label: "وصف الجمهور", type: "textarea", rows: 2, required: true, placeholder: "موظفين 25-40 سنة في القاهرة" },
          { name: "industry", label: "المجال", type: "text", required: true },
          { name: "platforms", label: "المنصّات", type: "text", defaultValue: "Instagram, TikTok, Facebook", placeholder: "Instagram, TikTok, LinkedIn..." },
        ]}
      />
    </div>
  );
}
