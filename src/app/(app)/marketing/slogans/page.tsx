import { GeneratorTool } from "@/components/generator-tool";
import { Quote } from "lucide-react";

export default function SlogansPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <GeneratorTool
        tool="slogans"
        title="مولّد الشعارات (Slogans)"
        description="10 شعارات قصيرة وجذّابة بأساليب مختلفة تناسب علامتك"
        icon={<Quote className="size-6" />}
        savedKind="note"
        fields={[{ name: "about", label: "عن العلامة/المنتج", type: "textarea", rows: 4, required: true, placeholder: "مثلاً: كافيه متخصص في القهوة المختصة، أجواء هادئة..." }]}
      />
    </div>
  );
}
