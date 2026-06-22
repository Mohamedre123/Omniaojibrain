import Link from "next/link";
import { Brain, Layout, ArrowRight, ArrowUpRight, Check, Wand2, Globe, Smartphone, Zap } from "lucide-react";
import { AnimatedBackground } from "@/components/animated-background";
import { SiteFooter } from "@/components/site-footer";
import { Reveal } from "@/components/reveal";

export const metadata = {
  title: "Oji Site Builder — منشئ المواقع",
  description: "منصّة Oji لإنشاء المواقع الاحترافية بسهولة. جرّبها الآن.",
};

const BUILDER_URL = "http://oji-builder.site/";

const PERKS = [
  { icon: Wand2, title: "إنشاءٌ بالذكاء الاصطناعي", desc: "اوصف فكرتك واحصل على موقعٍ كاملٍ جاهزٍ للنشر." },
  { icon: Smartphone, title: "متجاوبٌ تلقائياً", desc: "كلّ المواقع تعمل بشكلٍ مثاليٍّ على الجوال والكمبيوتر." },
  { icon: Globe, title: "انشره بضغطة", desc: "اربط نطاقك الخاصّ وانشر موقعك في دقائق." },
  { icon: Zap, title: "سريعٌ وخفيف", desc: "مواقع سريعة التحميل تُرضي زوّارك ومحرّكات البحث." },
];

export default function SiteBuilderPage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <AnimatedBackground />

      <nav className="glass sticky top-0 z-50 border-b safe-top">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="size-9 rounded-lg gradient-brand grid place-items-center animate-float-slow">
              <Brain className="size-5 text-white" />
            </div>
            <span className="text-xl font-bold">Oji Brain</span>
          </Link>
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowRight className="size-4" /> رجوع
          </Link>
        </div>
      </nav>

      <section className="container mx-auto px-4 py-14 sm:py-20 text-center">
        <Reveal className="max-w-2xl mx-auto">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border bg-accent/50 px-4 py-1.5 text-sm">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" /> منصّةٌ مستقلّةٌ من Oji
          </div>
          <div className="mx-auto size-16 rounded-2xl gradient-brand grid place-items-center mb-5 animate-float-slow">
            <Layout className="size-8 text-white" />
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold leading-tight">
            أنشئ <span className="text-gradient animate-gradient">موقعك الاحترافي</span> في دقائق
          </h1>
          <p className="mt-5 text-muted-foreground leading-relaxed">
            <span className="font-semibold text-foreground">Oji Site Builder</span> منصّةٌ مخصّصةٌ لإنشاء المواقع —
            من فكرةٍ بسيطةٍ إلى موقعٍ كاملٍ جاهزٍ للنشر، بدون خبرةٍ تقنية. جرّبها الآن وابنِ موقعك بنفسك.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
            <a
              href={BUILDER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 h-14 px-8 rounded-xl gradient-brand text-white text-base font-medium hover:opacity-90 transition-opacity hover-lift w-full sm:w-auto"
            >
              جرّب منشئ المواقع الآن
              <ArrowUpRight className="size-5" />
            </a>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center h-14 px-8 rounded-xl border text-base font-medium hover:bg-accent transition-colors w-full sm:w-auto"
            >
              العودة إلى Oji Brain
            </Link>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">سيُفتح الموقع في تبويبٍ جديد — حسابك في Oji Brain يبقى كما هو.</p>
        </Reveal>

        <div className="mt-16 grid gap-5 sm:grid-cols-2 max-w-3xl mx-auto text-right">
          {PERKS.map((p, i) => (
            <Reveal key={p.title} delay={i * 90}>
              <div className="gradient-border rounded-2xl p-6 h-full hover-lift flex items-start gap-4">
                <div className="size-11 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0">
                  <p.icon className="size-6" />
                </div>
                <div>
                  <h3 className="font-semibold">{p.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{p.desc}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={150} className="mt-12 max-w-2xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl gradient-brand p-8 sm:p-10 text-white">
            <div aria-hidden className="absolute inset-0 animate-shine" />
            <div className="relative">
              <h2 className="text-2xl sm:text-3xl font-bold">جاهزٌ تبني موقعك؟</h2>
              <p className="mt-2 text-white/90">افتح Oji Site Builder وابدأ مجاناً.</p>
              <a
                href={BUILDER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center justify-center gap-2 h-12 px-8 rounded-xl bg-white text-primary font-semibold hover:opacity-90 transition-opacity"
              >
                ابدأ الآن <ArrowUpRight className="size-5" />
              </a>
              <div className="mt-5 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-white/85">
                {["بدون خبرة تقنية", "متجاوب تلقائياً", "انشر بضغطة"].map((x) => (
                  <span key={x} className="inline-flex items-center gap-1.5"><Check className="size-4" /> {x}</span>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </section>
      <SiteFooter />
    </main>
  );
}
