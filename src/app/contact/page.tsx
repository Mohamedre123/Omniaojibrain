import Link from "next/link";
import { Brain, Phone, Headphones, AlertCircle, MessageCircle, ArrowRight, Mail } from "lucide-react";
import { AnimatedBackground } from "@/components/animated-background";
import { SiteFooter } from "@/components/site-footer";
import { Reveal } from "@/components/reveal";

export const metadata = {
  title: "تواصل معنا — Oji Brain",
  description: "قنوات التواصل مع فريق Oji Brain: الهاتف، الشكاوى، وخدمة العملاء.",
};

type Channel = {
  label: string;
  desc: string;
  icon: typeof Phone;
  color: string;
  number?: string;
  wa?: string;
  email?: string;
};

const CHANNELS: Channel[] = [
  {
    label: "رقم الهاتف",
    desc: "للاستفسارات العامة والتواصل المباشر",
    number: "+201200026457",
    wa: "201200026457",
    icon: Phone,
    color: "from-violet-500 to-purple-600",
  },
  {
    label: "رقم الشكاوى",
    desc: "لأيّ ملاحظةٍ أو مشكلةٍ تواجهك — نهتمّ برأيك",
    number: "+201200922780",
    wa: "201200922780",
    icon: AlertCircle,
    color: "from-rose-500 to-pink-600",
  },
  {
    label: "خدمة العملاء",
    desc: "الدعم والمساعدة (السعودية) على مدار الساعة",
    number: "+966576913063",
    wa: "966576913063",
    icon: Headphones,
    color: "from-emerald-500 to-teal-600",
  },
  {
    label: "بريد الشكاوى",
    desc: "راسلنا بأيّ شكوى أو ملاحظة وسنردّ عليك",
    email: "ojiagency1@gmail.com",
    icon: Mail,
    color: "from-blue-500 to-indigo-600",
  },
];

export default function ContactPage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <AnimatedBackground />

      {/* Nav */}
      <nav className="glass sticky top-0 z-50 border-b safe-top">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="size-9 rounded-lg gradient-brand grid place-items-center animate-float-slow">
              <Brain className="size-5 text-white" />
            </div>
            <span className="text-xl font-bold">Oji Brain</span>
          </Link>
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowRight className="size-4" /> الرئيسية
          </Link>
        </div>
      </nav>

      <section className="container mx-auto px-4 py-14 sm:py-20">
        <Reveal className="text-center max-w-2xl mx-auto">
          <div className="mx-auto size-16 rounded-2xl gradient-brand grid place-items-center mb-5 animate-float-slow">
            <Headphones className="size-8 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold">تواصل معنا</h1>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            فريق <span className="text-foreground font-medium">Oji Brain</span> في خدمتك. اختر القناة الأنسب لك من القنوات التالية،
            وسنردّ عليك بأسرع وقتٍ ممكن — سواءٌ كنت تحتاج مساعدةً، أو لديك استفسار، أو تودّ مشاركتنا ملاحظتك.
          </p>
        </Reveal>

        <div className="mt-12 flex gap-4 overflow-x-auto snap-x snap-mandatory pb-3 -mx-4 px-4 sm:mx-0 sm:px-0 sm:overflow-visible sm:grid sm:grid-cols-2 lg:grid-cols-4 max-w-5xl lg:mx-auto">
          {CHANNELS.map((c, i) => (
            <Reveal key={c.label} delay={i * 100} className="min-w-[80%] shrink-0 snap-center sm:min-w-0 sm:shrink">
              <div className="gradient-border rounded-2xl p-6 h-full hover-lift flex flex-col">
                <div className={`size-12 rounded-xl bg-gradient-to-br ${c.color} grid place-items-center text-white mb-4`}>
                  <c.icon className="size-6" />
                </div>
                <h2 className="text-lg font-bold">{c.label}</h2>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed flex-1">{c.desc}</p>
                {c.email ? (
                  <p dir="ltr" className="mt-4 text-base font-bold tracking-wide text-right break-all" style={{ direction: "ltr" }}>
                    {c.email}
                  </p>
                ) : (
                  <a href={`tel:${c.number}`} dir="ltr" className="mt-4 block text-base sm:text-lg font-bold tracking-wide text-right break-all hover:text-primary transition-colors" style={{ direction: "ltr" }}>
                    {c.number}
                  </a>
                )}
                {c.email ? (
                  <div className="mt-4">
                    <a
                      href={`mailto:${c.email}`}
                      className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg gradient-brand text-white text-sm font-medium h-10 px-3 hover:opacity-90 transition-opacity"
                    >
                      <Mail className="size-4" /> راسلنا بالبريد
                    </a>
                  </div>
                ) : (
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <a
                      href={`tel:${c.number}`}
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg gradient-brand text-white text-sm font-medium h-10 px-3 hover:opacity-90 transition-opacity"
                    >
                      <Phone className="size-4" /> اتصال
                    </a>
                    <a
                      href={`https://wa.me/${c.wa}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg border text-sm font-medium h-10 px-3 hover:bg-accent transition-colors"
                    >
                      <MessageCircle className="size-4 text-emerald-500" /> واتساب
                    </a>
                  </div>
                )}
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={200} className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            نسعد بخدمتك دائماً 💜 — Oji Brain، جزءٌ من Oji.
          </p>
        </Reveal>
      </section>
      <SiteFooter />
    </main>
  );
}
