import { GeneratorTool } from "@/components/generator-tool";
import { SeoAutoPanel } from "@/components/seo-auto-panel";
import { Newspaper } from "lucide-react";

export default function SeoArticlePage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <GeneratorTool
        tool="seo_article"
        title="كاتب مقالات SEO"
        description="موضوع/كلمة مفتاحية → مقال محسّن لجوجل جاهز للنشر (عنوان + ميتا + هيكل + FAQ)"
        icon={<Newspaper className="size-6" />}
        savedKind="note"
        fields={[
          { name: "topic", label: "الموضوع / الكلمة المفتاحية", type: "text", required: true, placeholder: "مثلاً: أفضل عطور رجالي 2026" },
          { name: "about", label: "عن نشاطك (اختياري)", type: "textarea", rows: 2, required: false, placeholder: "نوع النشاط والجمهور المستهدف..." },
        ]}
      />
      <SeoAutoPanel />
    </div>
  );
}
