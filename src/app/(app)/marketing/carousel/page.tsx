import { GeneratorTool } from "@/components/generator-tool";
import { GalleryHorizontalEnd } from "lucide-react";

export default function CarouselPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <GeneratorTool
        tool="carousel"
        title="تصميم كاروسيل"
        description="حوّل موضوعك إلى كاروسيل (5–7 شرائح) جاهز للتصميم — عنوان ونص واقتراح بصري لكل شريحة"
        icon={<GalleryHorizontalEnd className="size-6" />}
        savedKind="note"
        fields={[
          { name: "topic", label: "موضوع الكاروسيل", type: "textarea", rows: 4, required: true, placeholder: "مثلاً: 5 أخطاء تسويقية تجنّبها / خطوات إطلاق متجرك الإلكتروني..." },
        ]}
      />
    </div>
  );
}
