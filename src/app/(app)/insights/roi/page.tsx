import { GeneratorTool } from "@/components/generator-tool";
import { Calculator } from "lucide-react";

export default function RoiPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <GeneratorTool
        tool="roi_calculator"
        title="حاسبة ROI الإعلانات"
        description="توقّعات نتائج حملتك قبل التشغيل (متشائم / واقعي / متفائل)"
        icon={<Calculator className="size-6" />}
        savedKind="note"
        fields={[
          { name: "budget", label: "الميزانية بالعملة المحلّيّة", type: "text", required: true, placeholder: "5000 ج.م شهرياً" },
          { name: "industry", label: "الصناعة", type: "text", required: true },
          { name: "platform", label: "المنصّة", type: "select", defaultValue: "meta", options: [
            { label: "Meta (Facebook + Instagram)", value: "meta" },
            { label: "Google Ads", value: "google" },
            { label: "TikTok Ads", value: "tiktok" },
            { label: "Snapchat Ads", value: "snapchat" },
          ]},
          { name: "objective", label: "الهدف", type: "select", defaultValue: "leads", options: [
            { label: "Leads", value: "leads" },
            { label: "مبيعات", value: "sales" },
            { label: "وعي بالعلامة", value: "awareness" },
            { label: "حركة على الموقع", value: "traffic" },
          ]},
          { name: "avgPrice", label: "متوسط سعر منتجك (للمبيعات)", type: "text", placeholder: "300 ج.م" },
        ]}
      />
    </div>
  );
}
