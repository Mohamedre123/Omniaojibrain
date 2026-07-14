import { GeneratorTool } from "@/components/generator-tool";
import { PackageOpen } from "lucide-react";

export default function ProductDescPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <GeneratorTool
        tool="product_desc"
        title="وصف منتج للمتاجر"
        description="عنوان + وصف بيعي احترافي + كلمات مفتاحية (SEO) جاهز لسلة/زد/إنستجرام"
        icon={<PackageOpen className="size-6" />}
        savedKind="note"
        allowAttachments
        fields={[{ name: "product", label: "المنتج وتفاصيله", type: "textarea", rows: 5, required: true, placeholder: "اسم المنتج، مكوّناته/مميزاته، السعر، الجمهور... (وارفع صورته اختيارياً)" }]}
      />
    </div>
  );
}
