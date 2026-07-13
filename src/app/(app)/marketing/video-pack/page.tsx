import { GeneratorTool } from "@/components/generator-tool";
import { Clapperboard } from "lucide-react";

export default function VideoPackPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <GeneratorTool
        tool="video_pack"
        title="قوالب فيديو جاهزة"
        description="فكرة → سكربت + برومبتات فيديو (Text-to-Video · Image-to-Video · Start/End Frame) + مقترح موسيقى"
        icon={<Clapperboard className="size-6" />}
        savedKind="video_prompt"
        fields={[
          { name: "idea", label: "المنتج أو فكرة الفيديو", type: "textarea", rows: 4, required: true, placeholder: "مثلاً: إعلان عصير برتقال طازج للريلز / فيديو افتتاح متجر ملابس..." },
        ]}
      />
    </div>
  );
}
