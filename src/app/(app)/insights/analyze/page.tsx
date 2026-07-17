import { GeneratorTool } from "@/components/generator-tool";
import { ScanEye } from "lucide-react";

export default function AnalyzePage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <GeneratorTool
        tool="analyze_creative"
        title="تحليل الأداء بالصورة"
        description="ارفع صورة نتائج حملة / بوست / إعلان — و Oji يقرأها ويحلّلها ويعطيك توصيات"
        icon={<ScanEye className="size-6" />}
        savedKind="note"
        allowAttachments
        fields={[{ name: "context", label: "معلومات إضافية (اختياري)", type: "textarea", rows: 3, required: false, placeholder: "مثلاً: إعلان لمتجر ملابس، الميزانية 500 ر.س، الهدف مبيعات..." }]}
      />
    </div>
  );
}
