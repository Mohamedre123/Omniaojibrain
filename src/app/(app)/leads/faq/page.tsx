import { GeneratorTool } from "@/components/generator-tool";
import { HelpCircle } from "lucide-react";

export default function FaqPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <GeneratorTool
        tool="faq_generator"
        title="مولّد الأسئلة الشائعة (FAQ)"
        description="15 سؤال شائع + إجابات مفصّلة عن منتجك"
        icon={<HelpCircle className="size-6" />}
        savedKind="faq"
        fields={[
          { name: "product", label: "اسم المنتج/الخدمة", type: "text", required: true },
          { name: "context", label: "تفاصيل إضافية", type: "textarea", rows: 3, placeholder: "نوع المنتج، طريقة البيع، شروط الشحن..." },
        ]}
      />
    </div>
  );
}
