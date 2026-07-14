import { GeneratorTool } from "@/components/generator-tool";
import { Tag } from "lucide-react";

export default function NamesPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <GeneratorTool
        tool="brand_names"
        title="مولّد الأسماء التجارية"
        description="12 اسماً مقترحاً لعلامتك أو منتجك — مع سبب كل اسم واقتراح دومين"
        icon={<Tag className="size-6" />}
        savedKind="note"
        fields={[{ name: "about", label: "عن العلامة/المنتج", type: "textarea", rows: 4, required: true, placeholder: "مثلاً: متجر عبايات عصرية فاخرة للفتيات في السعودية..." }]}
      />
    </div>
  );
}
