import { GeneratorTool } from "@/components/generator-tool";
import { FileSignature } from "lucide-react";

export default function ContractPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <GeneratorTool
        tool="contract"
        title="عقد تسويق"
        description="قالب عقد قانوني بالعربية"
        icon={<FileSignature className="size-6" />}
        savedKind="contract"
        fields={[
          { name: "party1", label: "الطرف الأول (مقدّم الخدمة)", type: "text", required: true },
          { name: "party2", label: "الطرف الثاني (العميل)", type: "text", required: true },
          { name: "services", label: "وصف الخدمات", type: "textarea", rows: 4, required: true },
          { name: "duration", label: "مدّة العقد", type: "text", placeholder: "6 أشهر" },
          { name: "fees", label: "الأتعاب", type: "text", placeholder: "5000 ج.م شهرياً" },
        ]}
      />
    </div>
  );
}
