import { GeneratorTool } from "@/components/generator-tool";
import { Languages } from "lucide-react";

export default function TranslatePage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <GeneratorTool
        tool="translate_dialects"
        title="تحويل بين اللهجات"
        description="نصّ واحد → مصري / خليجي / شامي / فصحى / English بنفس المعنى"
        icon={<Languages className="size-6" />}
        savedKind="note"
        fields={[{ name: "text", label: "النصّ", type: "textarea", rows: 4, required: true, placeholder: "الصق نصّك هنا..." }]}
      />
    </div>
  );
}
