import { GeneratorTool } from "@/components/generator-tool";
import { MessageSquare } from "lucide-react";

export default function SalesScriptsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <GeneratorTool
        tool="sales_script"
        title="سكربتات مبيعات"
        description="نصوص جاهزة لمكالمة باردة، رسالة DM، عرض منتج"
        icon={<MessageSquare className="size-6" />}
        savedKind="sales_script"
        fields={[
          { name: "product", label: "ما الذي تبيعه؟", type: "text", required: true },
          { name: "target", label: "الجمهور المستهدف", type: "text" },
          { name: "pain", label: "أكبر مشكلة لدى العميل", type: "textarea", rows: 2 },
        ]}
      />
    </div>
  );
}
