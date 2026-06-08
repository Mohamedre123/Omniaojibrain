import { GeneratorTool } from "@/components/generator-tool";
import { Shuffle } from "lucide-react";

export default function VariationsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <GeneratorTool
        tool="variations"
        title="A/B Variations"
        description="5 نسخ من نفس النصّ بأساليبَ مختلفة"
        icon={<Shuffle className="size-6" />}
        savedKind="note"
        fields={[
          { name: "text", label: "النصّ الأصلي", type: "textarea", rows: 4, required: true, placeholder: "الصق نصّك هنا..." },
        ]}
      />
    </div>
  );
}
