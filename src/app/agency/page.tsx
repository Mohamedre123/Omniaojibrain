import Link from "next/link";
import { Brain, ArrowRight, ArrowUpRight, Check, Store, Megaphone, TrendingUp, ShoppingBag } from "lucide-react";
import { AnimatedBackground } from "@/components/animated-background";
import { SiteFooter } from "@/components/site-footer";
import { Reveal } from "@/components/reveal";

export const metadata = {
  title: "Oji Agency — التسويق الإلكتروني",
  description: "باقات Oji للتسويق الإلكتروني: إدارة المتاجر والسوشيال وزيادة المبيعات.",
};

const AGENCY_URL = "https://oji.agency/";

const PLANS = [
  {
    name: "البداية",
    icon: Megaphone,
    color: "from-blue-500 to-cyan-600",
    tagline: "انطلاقة قوية لحضورك الرقمي",
    features: ["إدارة حسابات السوشيال ميديا", "تصميم منشورات شهرية", "خطة محتوى احترافية", "تقارير أداء دورية"],
    popular: false,
  },
  {
    name: "النمو",
    icon: Store,
    color: "from-violet-500 to-fuchsia-600",
    tagline: "الأنسب للمتاجر الناشئة",
    features: ["كل مميزات البداية", "إدارة المتجر الإلكتروني", "حملات إعلانية مموّلة", "تحسين صفحات المنتجات", "ردّ على العملاء"],
    popular: true,
  },
  {
    name: "التميّز",
    icon: TrendingUp,
    color: "from-amber-500 to-orange-600",
    tagline: "لزيادة المبيعات بقوة",
    features: ["كل مميزات النمو", "استراتيجية نمو متكاملة", "إدارة متعددة المنصّات", "تحليلات متقدّمة", "مدير حساب مخصّص"],
    popular: false,
  },
];

export default function AgencyPage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden flex flex-col">
      <AnimatedBackground />

      <nav className="glass sticky top-0 z-50 border-b safe-top">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="size-9 rounded-lg gradient-brand grid place-items-center animate-float-slow"><Brain className="size-5 text-white" /></div>
            <span className="text-xl font-bold">Oji Brain</span>
          </Link>
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"><ArrowRight className="size-4" /> رجوع</Link>
        </div>
      </nav>

      <section className="container mx-auto px-4 py-14 sm:py-20">
        <Reveal className="text-center max-w-2xl mx-auto">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border bg-accent/50 px-4 py-1.5 text-sm">
            <ShoppingBag className="size-4 text-primary" /> الوكالة الرسمية — Oji Agency
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold leading-tight">
            خلّي فريق <span className="text-gradient animate-gradient">Oji</span> يدير تسويقك ويزوّد مبيعاتك
          </h1>
          <p className="mt-5 text-muted-foreground leading-relaxed">
            مش عايز تعمل كله بنفسك؟ <span className="font-semibold text-foreground">Oji Agency</span> بتتولّى إدارة متجرك وصفحاتك وسوشيال ميديا وحملاتك الإعلانية —
            وإنت تركّز على منتجك واحنا نزوّد مبيعاتك.
          </p>
        </Reveal>

        <div className="mt-12 flex gap-4 overflow-x-auto snap-x snap-mandatory pb-3 -mx-4 px-4 md:mx-0 md:px-0 md:overflow-visible md:grid md:grid-cols-3 md:items-stretch max-w-5xl lg:mx-auto">
          {PLANS.map((p, i) => (
            <Reveal key={p.name} delay={i * 90} className="min-w-[82%] shrink-0 snap-center md:min-w-0 md:shrink">
              <div className={`relative h-full rounded-2xl border bg-card/85 backdrop-blur-md p-6 flex flex-col shadow-lg ${p.popular ? "border-primary ring-2 ring-primary/30 md:scale-[1.03]" : "border-border/60"}`}>
                {p.popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full gradient-brand text-white text-xs font-bold px-3 py-1 shadow">⭐ الأنسب</span>}
                <div className={`size-12 rounded-xl bg-gradient-to-br ${p.color} grid place-items-center text-white mb-4`}><p.icon className="size-6" /></div>
                <h2 className="text-xl font-bold">{p.name}</h2>
                <p className="text-sm text-muted-foreground mt-1">{p.tagline}</p>
                <ul className="mt-5 space-y-2.5 flex-1">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm"><Check className="size-4 text-emerald-500 shrink-0 mt-0.5" /><span>{f}</span></li>
                  ))}
                </ul>
                <a href={AGENCY_URL} target="_blank" rel="noopener noreferrer" className={`mt-6 inline-flex items-center justify-center gap-2 h-12 rounded-xl font-semibold transition-opacity hover:opacity-90 ${p.popular ? "gradient-brand text-white" : "border bg-background"}`}>
                  اطلب الباقة <ArrowUpRight className="size-4" />
                </a>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={150} className="mt-12 max-w-2xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl gradient-brand p-8 sm:p-10 text-white text-center">
            <div aria-hidden className="absolute inset-0 animate-shine" />
            <div className="relative">
              <h2 className="text-2xl sm:text-3xl font-bold">جاهز تكبّر مبيعاتك؟</h2>
              <p className="mt-2 text-white/90">تصفّح كل الباقات والخدمات على موقع Oji Agency الرسمي.</p>
              <a href={AGENCY_URL} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex items-center justify-center gap-2 h-12 px-8 rounded-xl bg-white text-primary font-semibold hover:opacity-90 transition-opacity">
                زوروا oji.agency <ArrowUpRight className="size-5" />
              </a>
              <p className="mt-4 text-xs text-white/80">سيُفتح الموقع الرسمي في تبويبٍ جديد — حسابك في Oji Brain يبقى كما هو.</p>
            </div>
          </div>
        </Reveal>
      </section>

      <SiteFooter />
    </main>
  );
}
