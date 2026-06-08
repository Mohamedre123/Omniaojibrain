import { GeneratorTool } from "@/components/generator-tool";
import { Palette } from "lucide-react";

export default function MoodBoardPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <GeneratorTool
        tool="mood_board"
        title="Mood Board"
        description="لوحة بصرية تجمع كل هوية العلامة + 6 برومبتات صور جاهزة"
        icon={<Palette className="size-6" />}
        savedKind="mood_board"
        fields={[
          { name: "vibe", label: "الإحساس العام", type: "text", required: true, placeholder: "هادئ، طبيعي، حنيني" },
          { name: "elements", label: "عناصر تحبها", type: "textarea", rows: 3, placeholder: "نباتات، أخشاب، حرف يدوية" },
          { name: "avoid", label: "عناصر لا تريدها", type: "text", placeholder: "أبيض ناصع، ألوان نيون" },
        ]}
      />
    </div>
  );
}
