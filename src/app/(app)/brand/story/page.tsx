import { GeneratorTool } from "@/components/generator-tool";
import { BookOpen } from "lucide-react";

export default function BrandStoryPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <GeneratorTool
        tool="brand_story"
        title="Brand Story Builder"
        description="اكتب قصة علامتك بأسلوب سرديٍّ جذّاب"
        icon={<BookOpen className="size-6" />}
        savedKind="brand_kit"
        fields={[
          { name: "founder", label: "اسم المؤسّس (اختياري)", type: "text" },
          { name: "origin", label: "كيف بدأت الفكرة؟", type: "textarea", rows: 3, required: true },
          { name: "challenge", label: "ما التحدّي الذي واجهته؟", type: "textarea", rows: 2 },
          { name: "milestone", label: "أهمّ إنجاز حتى الآن", type: "text" },
          { name: "future", label: "إلى أين تتجه؟", type: "textarea", rows: 2 },
        ]}
      />
    </div>
  );
}
