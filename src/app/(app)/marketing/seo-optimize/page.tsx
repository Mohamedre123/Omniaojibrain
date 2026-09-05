import { GeneratorTool } from "@/components/generator-tool";
import { Search } from "lucide-react";

export default function SeoOptimizePage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <GeneratorTool
        tool="seo_optimize"
        title="محسّن السيو (SEO)"
        description="الصق أي محتوى (موقع/منشور/بايو/وصف منتج) → نسخة محسّنة لجوجل والسوشيال + كلمات مفتاحية وهاشتاجات"
        icon={<Search className="size-6" />}
        savedKind="note"
        fields={[
          {
            name: "type",
            label: "نوع المحتوى",
            type: "select",
            required: true,
            options: [
              { label: "صفحة/موقع", value: "website" },
              { label: "منشور سوشيال", value: "social_post" },
              { label: "بايو / نبذة", value: "bio" },
              { label: "وصف منتج", value: "product" },
            ],
          },
          { name: "content", label: "المحتوى الحالي", type: "textarea", rows: 8, required: true, placeholder: "الصق النص اللي عايز تحسّنه هنا..." },
          { name: "keyword", label: "كلمة مفتاحية مستهدفة (اختياري)", type: "text", required: false, placeholder: "مثلاً: شحن مجاني القاهرة" },
        ]}
      />
    </div>
  );
}
