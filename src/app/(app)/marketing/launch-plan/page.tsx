import { GeneratorTool } from "@/components/generator-tool";
import { Rocket } from "lucide-react";

export default function LaunchPlanPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <GeneratorTool
        tool="product_launch"
        title="مخطّط إطلاق منتج"
        description="خطة إطلاق بعدّ تنازلي: تشويق → إطلاق → متابعة، بالمحتوى والتوقيت"
        icon={<Rocket className="size-6" />}
        savedKind="strategy"
        fields={[
          { name: "product", label: "اسم المنتج", type: "text", required: true, placeholder: "مثلاً: كولكشن الشتاء الجديد" },
          { name: "about", label: "وصف المنتج والجمهور", type: "textarea", rows: 3, required: true, placeholder: "إيه المنتج، مميّزاته، ومين جمهوره..." },
          { name: "date", label: "تاريخ الإطلاق (اختياري)", type: "text", required: false, placeholder: "مثلاً: 1 أكتوبر" },
        ]}
      />
    </div>
  );
}
