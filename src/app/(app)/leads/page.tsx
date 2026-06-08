import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Globe, FileText, Bot, HelpCircle, MessageSquare, Target } from "lucide-react";

const TOOLS = [
  {
    href: "/leads/landing-page",
    icon: Globe,
    title: "Landing Page Builder",
    description: "صفحة هبوط احترافية بأنيميشن وألوان علامتك — لمنتج، خدمة، CV، أو بورتفوليو",
    color: "from-violet-500 to-purple-600",
    badge: "متطوّر",
  },
  {
    href: "/leads/lead-magnet",
    icon: FileText,
    title: "Lead Magnet (كتيّب PDF)",
    description: "كتيّب مجاني احترافي يقدّمه العميل لجذب الإيميلات والـ Leads",
    color: "from-blue-500 to-cyan-600",
  },
  {
    href: "/leads/chatbot",
    icon: Bot,
    title: "Chatbot لموقعك",
    description: "كود JS تحطّه في موقعك، شات يجيب زوّارك تلقائياً",
    color: "from-emerald-500 to-teal-600",
  },
  {
    href: "/leads/faq",
    icon: HelpCircle,
    title: "مولّد الأسئلة الشائعة (FAQ)",
    description: "15 سؤال شائع + إجاباتٍ مفصّلة عن منتجك",
    color: "from-orange-500 to-amber-600",
  },
  {
    href: "/leads/sales-scripts",
    icon: MessageSquare,
    title: "سكربتات مبيعات",
    description: "نصوص جاهزة لمكالمة باردة، DM، عرض منتج",
    color: "from-rose-500 to-pink-600",
  },
];

export default function LeadsHubPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Target className="size-7 text-primary" />
          جذب العملاء
        </h1>
        <p className="text-muted-foreground mt-2">
          أدوات تحوّل زوّارك إلى عملاء فعليين
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
                      <span className="text-xs bg-primary/15 text-primary px-2 py-0.5 rounded-full font-medium">
                        {t.badge}
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold group-hover:text-primary transition-colors">
                    {t.title}
                  </h3>
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
