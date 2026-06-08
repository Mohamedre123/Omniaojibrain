import { GeneratorTool } from "@/components/generator-tool";
import { FileText } from "lucide-react";

export default function LeadMagnetPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <GeneratorTool
        tool="lead_magnet"
        title="مولّد Lead Magnet"
        description="كتيّب PDF احترافي للعميل يقدمه مجاناً ليجمع إيميلات"
        icon={<FileText className="size-6" />}
        savedKind="lead_magnet"
        outputType="markdown"
        fields={[
          { name: "topic", label: "موضوع الكتيّب", type: "text", required: true, placeholder: "مثلاً: دليل اختيار أفضل خطّة تسويق للمطاعم" },
          { name: "audience", label: "الجمهور المستهدف", type: "text", placeholder: "أصحاب مطاعم ناشئة" },
          { name: "pages", label: "عدد الصفحات التقريبي", type: "select", defaultValue: "5", options: [
            { label: "1 صفحة (Cheatsheet)", value: "1" },
            { label: "5 صفحات", value: "5" },
            { label: "10 صفحات", value: "10" },
            { label: "20 صفحة (كتاب صغير)", value: "20" },
          ]},
          { name: "tone", label: "النبرة", type: "select", defaultValue: "professional", options: [
            { label: "احترافية", value: "professional" },
            { label: "ودودة", value: "friendly" },
            { label: "مرحة", value: "playful" },
            { label: "خبيرة موثوقة", value: "authoritative" },
          ]},
        ]}
      />
    </div>
  );
}
