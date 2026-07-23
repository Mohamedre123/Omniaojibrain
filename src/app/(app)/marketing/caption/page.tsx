import { GeneratorTool } from "@/components/generator-tool";
import { Captions } from "lucide-react";

export default function CaptionPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <GeneratorTool
        tool="caption_from_image"
        title="كابشن + هاشتاجات من صورة"
        description="ارفع صورة منتجك → 3 كابشن + دعوة للعمل + هاشتاجات جاهزة"
        icon={<Captions className="size-6" />}
        savedKind="note"
        allowAttachments
        fields={[{ name: "note", label: "معلومة عن المنتج (اختياري)", type: "text", required: false, placeholder: "مثلاً: عرض خصم 30% لفترة محدودة" }]}
      />
    </div>
  );
}
