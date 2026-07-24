import { GeneratorTool } from "@/components/generator-tool";
import { ScrollText } from "lucide-react";

export default function PoliciesPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <GeneratorTool
        tool="store_policies"
        title="مولّد سياسات المتجر"
        description="سياسة شحن / استرجاع / خصوصية / شروط استخدام جاهزة للّصق في سلة وزد وموقعك"
        icon={<ScrollText className="size-6" />}
        savedKind="note"
        fields={[
          {
            name: "type",
            label: "نوع السياسة",
            type: "select",
            required: true,
            options: [
              { label: "سياسة الشحن والتوصيل", value: "الشحن والتوصيل" },
              { label: "سياسة الاسترجاع والاسترداد", value: "الاسترجاع والاسترداد" },
              { label: "سياسة الخصوصية", value: "الخصوصية" },
              { label: "الشروط والأحكام", value: "الشروط والأحكام" },
            ],
          },
          { name: "store", label: "اسم المتجر ونوع المنتجات", type: "text", required: true, placeholder: "مثلاً: متجر نون للعطور" },
          { name: "details", label: "تفاصيل تخصّها (اختياري)", type: "textarea", rows: 3, required: false, placeholder: "مناطق التوصيل، مدة الشحن، مدة الاسترجاع، طرق الدفع، وسيلة التواصل..." },
        ]}
      />
    </div>
  );
}
