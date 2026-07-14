import Link from "next/link";
import { Card } from "@/components/ui/card";
import { TrendingUp, Search, Clock, Flame, Calculator, LineChart, UserSearch, Grid2x2 } from "lucide-react";

const TOOLS = [
  { href: "/insights/persona", icon: UserSearch, title: "شخصية العميل المثالي", description: "Buyer Persona: أهدافه، ألمه، اعتراضاته، قنواته", color: "from-indigo-500 to-violet-600", badge: "✨ جديد" },
  { href: "/insights/swot", icon: Grid2x2, title: "تحليل SWOT", description: "قوّة وضعف وفرص وتهديدات + توصيات", color: "from-teal-500 to-emerald-600", badge: "✨ جديد" },
  { href: "/insights/competitor", icon: Search, title: "تحليل المنافسين الذكي", description: "Oji يبحث عن منافسيك تلقائياً ويحلّلهم", color: "from-rose-500 to-pink-600", badge: "🤖 AI Search" },
  { href: "/insights/performance", icon: LineChart, title: "تتبّع الأداء", description: "ادخل أرقامك → تحليل وتوصيات", color: "from-violet-500 to-purple-600" },
  { href: "/insights/best-times", icon: Clock, title: "أفضل أوقات النشر", description: "اقتراح ساعات النشر لكلّ منصّة", color: "from-blue-500 to-cyan-600" },
  { href: "/insights/trends", icon: Flame, title: "مراقب الترندات", description: "أهمّ ترندات مجالك حالياً + كيف تستغلّها", color: "from-orange-500 to-amber-600" },
  { href: "/insights/roi", icon: Calculator, title: "حاسبة ROI الإعلانات", description: "توقّعات نتائج حملتك قبل التشغيل", color: "from-emerald-500 to-teal-600" },
];

export default function InsightsHubPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <TrendingUp className="size-7 text-primary" />
          الرؤى والتحليلات
        </h1>
        <p className="text-muted-foreground mt-2">
          ذكاءٌ تنافسيّ يساعدك تتفوّق على منافسيك
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
