import { GeneratorTool } from "@/components/generator-tool";
import { Recycle } from "lucide-react";

export default function RepurposePage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <GeneratorTool
        tool="content_repurpose"
        title="إعادة تدوير المحتوى"
        description="فكرة واحدة → بوست + ريلز + ستوري + تغريدة + لينكدإن + إيميل + هاشتاجات"
        icon={<Recycle className="size-6" />}
        savedKind="note"
        fields={[
          { name: "idea", label: "الفكرة أو المنشور الأصلي", type: "textarea", rows: 5, required: true, placeholder: "الصق فكرتك أو منشورك، وسنحوّله لكل المنصّات..." },
        ]}
      />
    </div>
  );
}
