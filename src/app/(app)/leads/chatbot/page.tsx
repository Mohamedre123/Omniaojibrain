import { GeneratorTool } from "@/components/generator-tool";
import { Bot } from "lucide-react";

export default function ChatbotPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <GeneratorTool
        tool="chatbot_widget"
        title="Chatbot لموقعك"
        description="كود JavaScript widget كامل تحطّه في موقعك، شات يجيب زوّارك"
        icon={<Bot className="size-6" />}
        savedKind="chatbot"
        outputType="html"
        fields={[
          { name: "business", label: "اسم البزنس", type: "text", required: true },
          { name: "greeting", label: "رسالة الترحيب", type: "text", placeholder: "أهلاً! كيف يمكنني مساعدتك؟" },
          { name: "faqs", label: "أسئلة شائعة وإجاباتها (افصل الـ Q-A بـ /)", type: "textarea", rows: 6, placeholder: "ما ساعات العمل؟ / من 9 صباحاً إلى 10 مساءً\nهل عندكم توصيل؟ / نعم لكل أنحاء القاهرة" },
        ]}
      />
    </div>
  );
}
