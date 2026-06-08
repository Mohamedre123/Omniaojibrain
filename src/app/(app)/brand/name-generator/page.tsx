import { GeneratorTool } from "@/components/generator-tool";
import { Lightbulb } from "lucide-react";

export default function NameGeneratorPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <GeneratorTool
        tool="brand_name"
        title="مولّد أسماء البراند"
        description="20 اسم مقترح في 4 فئات إبداعية"
        icon={<Lightbulb className="size-6" />}
        savedKind="note"
        fields={[
          { name: "industry", label: "القطاع", type: "text", required: true, placeholder: "مطعم سوشي / متجر ملابس..." },
          { name: "audience", label: "الجمهور المستهدف", type: "text", placeholder: "شباب / عيلات / محترفين" },
          { name: "vibe", label: "الإحساس المطلوب", type: "select", options: [
            { label: "فاخر وراقٍ", value: "luxury" },
            { label: "مرح وحيوي", value: "playful" },
            { label: "احترافي رسمي", value: "professional" },
            { label: "حنيني تقليدي", value: "traditional" },
            { label: "تقني عصري", value: "tech" },
          ]},
        ]}
      />
    </div>
  );
}
