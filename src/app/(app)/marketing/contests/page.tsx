import { GeneratorTool } from "@/components/generator-tool";
import { Gift } from "lucide-react";

export default function ContestsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <GeneratorTool
        tool="contest_ideas"
        title="أفكار مسابقات وجيف أواي"
        description="5 أفكار مسابقات لزيادة التفاعل والمتابعين + نص منشور جاهز"
        icon={<Gift className="size-6" />}
        savedKind="note"
        fields={[{ name: "about", label: "عن نشاطك وهدفك", type: "textarea", rows: 4, required: true, placeholder: "نوع النشاط، الجائزة المتاحة، والهدف (متابعين/تفاعل/مبيعات)..." }]}
      />
    </div>
  );
}
