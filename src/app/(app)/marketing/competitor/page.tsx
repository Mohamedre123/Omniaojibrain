import { GeneratorTool } from "@/components/generator-tool";
import { Swords } from "lucide-react";

export default function CompetitorPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <GeneratorTool
        tool="competitor_analysis"
        title="محلّل المنافس"
        description="الصق محتوى/وصف منافس → نقاط قوّته وضعفه وكيف تتميّز عنه + أفكار محتوى"
        icon={<Swords className="size-6" />}
        savedKind="strategy"
        fields={[
          { name: "competitor", label: "محتوى/وصف المنافس", type: "textarea", rows: 5, required: true, placeholder: "الصق بوستات المنافس، وصف حسابه، أو نبذة عنه..." },
          { name: "mybiz", label: "عن نشاطك أنت", type: "textarea", rows: 3, required: true, placeholder: "نوع نشاطك، مميّزاتك، وجمهورك..." },
        ]}
      />
    </div>
  );
}
