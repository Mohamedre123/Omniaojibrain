import { GeneratorTool } from "@/components/generator-tool";
import { UserSearch } from "lucide-react";

export default function PersonaPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <GeneratorTool
        tool="buyer_persona"
        title="شخصية العميل المثالي"
        description="تحليل Buyer Persona: الأهداف، نقاط الألم، الاعتراضات، القنوات، ونبرة الرسالة"
        icon={<UserSearch className="size-6" />}
        savedKind="note"
        fields={[{ name: "about", label: "عن مشروعك وجمهورك", type: "textarea", rows: 5, required: true, placeholder: "نوع النشاط، المنتج/الخدمة، ومن تعتقد أنه جمهورك..." }]}
      />
    </div>
  );
}
