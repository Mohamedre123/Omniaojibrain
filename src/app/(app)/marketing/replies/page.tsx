import { GeneratorTool } from "@/components/generator-tool";
import { MessagesSquare } from "lucide-react";

export default function RepliesPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <GeneratorTool
        tool="reply_comments"
        title="الردّ على العملاء والتقييمات"
        description="3 ردود مهذّبة واحترافية على أي تعليق أو رسالة — حتى السلبية"
        icon={<MessagesSquare className="size-6" />}
        savedKind="note"
        fields={[{ name: "comment", label: "التعليق / الرسالة", type: "textarea", rows: 4, required: true, placeholder: "الصق تعليق العميل هنا..." }]}
      />
    </div>
  );
}
