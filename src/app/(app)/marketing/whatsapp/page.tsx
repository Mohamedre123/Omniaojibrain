import { GeneratorTool } from "@/components/generator-tool";
import { MessageCircle } from "lucide-react";

export default function WhatsAppPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <GeneratorTool
        tool="whatsapp_template"
        title="WhatsApp Business Templates"
        description="3 رسائل (ترحيب / عرض / متابعة) تلتزم بسياسة Meta"
        icon={<MessageCircle className="size-6" />}
        savedKind="whatsapp_template"
        fields={[
          { name: "business", label: "اسم البزنس", type: "text", required: true },
          { name: "offer", label: "العرض / المنتج", type: "textarea", rows: 3, required: true },
          { name: "tone", label: "النبرة", type: "select", defaultValue: "friendly", options: [
            { label: "ودودة", value: "friendly" },
            { label: "احترافية", value: "professional" },
            { label: "مرحة", value: "playful" },
          ]},
        ]}
      />
    </div>
  );
}
