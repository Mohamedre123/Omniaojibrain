import { GeneratorTool } from "@/components/generator-tool";
import { Hash } from "lucide-react";

export default function HashtagsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <GeneratorTool
        tool="hashtags_advanced"
        title="مولّد هاشتاجات ذكي"
        description="30 هاشتاج موزّعة (عامّة / متوسّطة / محلّيّة)"
        icon={<Hash className="size-6" />}
        savedKind="note"
        allowAttachments={true}
        fields={[
          { name: "topic", label: "الموضوع / المنشور", type: "textarea", rows: 3, placeholder: "وصف المنشور أو المنتج" },
          { name: "platform", label: "المنصّة", type: "select", defaultValue: "instagram", options: [
            { label: "Instagram", value: "instagram" },
            { label: "TikTok", value: "tiktok" },
            { label: "Twitter/X", value: "twitter" },
            { label: "LinkedIn", value: "linkedin" },
          ]},
          { name: "language", label: "اللغة", type: "select", defaultValue: "mixed", options: [
            { label: "خليط عربي + إنجليزي", value: "mixed" },
            { label: "عربي فقط", value: "ar" },
            { label: "إنجليزي فقط", value: "en" },
          ]},
        ]}
      />
    </div>
  );
}
