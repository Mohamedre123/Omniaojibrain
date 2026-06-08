import { GeneratorTool } from "@/components/generator-tool";
import { Flame } from "lucide-react";

export default function TrendsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <GeneratorTool
        tool="trends_monitor"
        title="مراقب الترندات"
        description="أهمّ 5 ترندات في مجالك حالياً + كيف تستغلّها"
        icon={<Flame className="size-6" />}
        savedKind="note"
        fields={[
          { name: "industry", label: "مجالك", type: "text", required: true },
          { name: "region", label: "المنطقة الجغرافية", type: "text", defaultValue: "العالم العربي" },
        ]}
      />
    </div>
  );
}
