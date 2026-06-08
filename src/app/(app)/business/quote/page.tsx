import { GeneratorTool } from "@/components/generator-tool";
import { DollarSign } from "lucide-react";

export default function QuotePage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <GeneratorTool
        tool="quote"
        title="عرض سعر (Proposal)"
        description="عرض احترافي بـ 3 باقات يبيع نفسه"
        icon={<DollarSign className="size-6" />}
        savedKind="quote"
        fields={[
          { name: "client", label: "اسم العميل", type: "text", required: true },
          { name: "service", label: "الخدمة المطلوبة", type: "textarea", rows: 3, required: true },
          { name: "challenges", label: "تحدّيات العميل", type: "textarea", rows: 2 },
          { name: "budgetRange", label: "نطاق الميزانية المتوقّع", type: "text", placeholder: "5000 - 15000 ج.م" },
          { name: "timeline", label: "الإطار الزمني", type: "text", placeholder: "3 أشهر" },
        ]}
      />
    </div>
  );
}
