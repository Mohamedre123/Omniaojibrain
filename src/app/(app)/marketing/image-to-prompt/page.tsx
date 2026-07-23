import { GeneratorTool } from "@/components/generator-tool";
import { ScanText } from "lucide-react";

export default function ImageToPromptPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <GeneratorTool
        tool="image_to_prompt"
        title="صورة → برومبت"
        description="ارفع صورة و Oji يطلّعلك البرومبت اللي يعيد إنتاجها (عربي / English / JSON)"
        icon={<ScanText className="size-6" />}
        savedKind="note"
        allowAttachments
        fields={[{ name: "note", label: "ملاحظة (اختياري)", type: "text", required: false, placeholder: "مثلاً: ركّز على الإضاءة والألوان" }]}
      />
    </div>
  );
}
