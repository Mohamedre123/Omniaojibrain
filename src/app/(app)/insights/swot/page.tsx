import { GeneratorTool } from "@/components/generator-tool";
import { Grid2x2 } from "lucide-react";

export default function SwotPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <GeneratorTool
        tool="swot"
        title="تحليل SWOT"
        description="نقاط القوّة والضعف والفرص والتهديدات + توصيات استراتيجية"
        icon={<Grid2x2 className="size-6" />}
        savedKind="strategy"
        fields={[{ name: "about", label: "عن مشروعك وسوقك", type: "textarea", rows: 5, required: true, placeholder: "نوع النشاط، السوق، المنافسون، وضعك الحالي..." }]}
      />
    </div>
  );
}
