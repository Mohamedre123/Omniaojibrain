import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Sparkles, BookOpen, Award, Lightbulb, Palette, Wand2 } from "lucide-react";

const TOOLS = [
  { href: "/brand/wizard", icon: Wand2, title: "Brand Identity Wizard", description: "10 أسئلة → Brand Kit متكامل", color: "from-violet-500 to-purple-600", badge: "🔥 الأكثر طلباً" },
  { href: "/brand/name-generator", icon: Lightbulb, title: "مولّد أسماء البراند", description: "20 اسم مقترح في 4 فئات إبداعية", color: "from-amber-500 to-orange-600" },
  { href: "/brand/story", icon: BookOpen, title: "Brand Story Builder", description: "قصة علامتك بأسلوب سرديٍّ جذّاب", color: "from-rose-500 to-pink-600" },
  { href: "/brand/logo", icon: Award, title: "اقتراحات لوجو", description: "5 مفاهيم لوجو + برومبتات Midjourney", color: "from-blue-500 to-cyan-600" },
  { href: "/brand/mood-board", icon: Palette, title: "Mood Board", description: "لوحة بصرية تجمع هوية علامتك", color: "from-emerald-500 to-teal-600" },
];

export default function BrandHubPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Sparkles className="size-7 text-primary" />
          هوية العلامة
        </h1>
        <p className="text-muted-foreground mt-2">
          ابنِ علامةً تجاريةً تتميّز — من الاسم إلى الـ Brand Book الكامل
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {TOOLS.map((t) => {
          const Icon = t.icon;
          return (
            <Link key={t.href} href={t.href} className="group">
              <Card className="h-full overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1 cursor-pointer">
                <div className={`h-2 bg-gradient-to-r ${t.color}`} />
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`size-11 rounded-xl bg-gradient-to-br ${t.color} grid place-items-center`}>
                      <Icon className="size-5 text-white" />
                    </div>
                    {t.badge && (
                      <span className="text-xs bg-primary/15 text-primary px-2 py-0.5 rounded-full font-medium">{t.badge}</span>
                    )}
                  </div>
                  <h3 className="font-semibold group-hover:text-primary transition-colors">{t.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{t.description}</p>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
