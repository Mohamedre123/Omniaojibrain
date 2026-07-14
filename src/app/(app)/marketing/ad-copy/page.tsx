import { GeneratorTool } from "@/components/generator-tool";
import { Megaphone } from "lucide-react";

export default function AdCopyPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <GeneratorTool
        tool="ad_copy"
        title="نصوص إعلانات (Google & Meta)"
        description="عناوين ووصف إعلانات جاهزة لجوجل وفيسبوك/إنستجرام"
        icon={<Megaphone className="size-6" />}
        savedKind="note"
        fields={[{ name: "about", label: "المنتج/العرض والجمهور", type: "textarea", rows: 4, required: true, placeholder: "ما تعلن عنه، العرض، والجمهور المستهدف..." }]}
      />
    </div>
  );
}
