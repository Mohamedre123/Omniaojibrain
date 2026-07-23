import { GeneratorTool } from "@/components/generator-tool";
import { CalendarDays } from "lucide-react";

export default function MonthPlanPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <GeneratorTool
        tool="month_posts"
        title="خطة محتوى 30 يوم"
        description="خطة شهر كامل جاهزة: نوع كل منشور + فكرته + كابشن + أفضل وقت"
        icon={<CalendarDays className="size-6" />}
        savedKind="strategy"
        fields={[{ name: "about", label: "عن نشاطك", type: "textarea", rows: 3, required: true, placeholder: "نوع النشاط، المنتج/الخدمة، والجمهور..." }]}
      />
    </div>
  );
}
