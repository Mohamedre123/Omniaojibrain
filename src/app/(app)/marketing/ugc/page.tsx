import { GeneratorTool } from "@/components/generator-tool";
import { Video } from "lucide-react";

export default function UgcPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <GeneratorTool
        tool="ugc_script"
        title="سكربتات UGC (تيك توك / ريلز)"
        description="3 سكربتات جاهزة للتصوير بالموبايل: خطّاف + لقطات + نصّ منطوق + نصّ على الشاشة"
        icon={<Video className="size-6" />}
        savedKind="strategy"
        fields={[
          { name: "product", label: "المنتج / الخدمة", type: "text", required: true, placeholder: "مثلاً: سيروم فيتامين سي" },
          { name: "angle", label: "زاوية معيّنة؟ (اختياري)", type: "text", required: false, placeholder: "مثلاً: قبل/بعد الاستخدام، أو وراء الكواليس" },
        ]}
      />
    </div>
  );
}
