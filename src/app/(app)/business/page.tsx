import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Briefcase, Receipt, FileSignature, DollarSign, Users } from "lucide-react";

const TOOLS = [
  { href: "/business/invoice", icon: Receipt, title: "مولّد فواتير", description: "فاتورة HTML احترافية قابلة للطباعة", color: "from-blue-500 to-cyan-600" },
  { href: "/business/quote", icon: DollarSign, title: "عرض سعر (Proposal)", description: "عرض احترافي بـ 3 باقات", color: "from-emerald-500 to-teal-600" },
  { href: "/business/contract", icon: FileSignature, title: "عقد تسويق", description: "قالب عقد قانوني بالعربية", color: "from-violet-500 to-purple-600" },
  { href: "/business/crm", icon: Users, title: "CRM بسيط", description: "تابع Leads وعملاءك في مكان واحد", color: "from-rose-500 to-pink-600" },
];

export default function BusinessHubPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Briefcase className="size-7 text-primary" />
          أدوات الأعمال
        </h1>
        <p className="text-muted-foreground mt-2">
          أدوات إدارية للفريلانسر والوكالات
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
                  <div className={`size-11 rounded-xl bg-gradient-to-br ${t.color} grid place-items-center mb-3`}>
                    <Icon className="size-5 text-white" />
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
