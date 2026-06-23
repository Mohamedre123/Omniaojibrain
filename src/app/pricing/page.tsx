"use client";

import { useState } from "react";
import Link from "next/link";
import { Brain, ArrowRight, Check, Sparkles, Crown, Rocket } from "lucide-react";
import { AnimatedBackground } from "@/components/animated-background";
import { SiteFooter } from "@/components/site-footer";
import { Reveal } from "@/components/reveal";

type Cur = "EGP" | "SAR" | "USD";

const CURRENCIES: Record<Cur, { label: string; name: string }> = {
  EGP: { label: "ج.م", name: "🇪🇬 مصري" },
  SAR: { label: "ر.س", name: "🇸🇦 سعودي" },
  USD: { label: "$", name: "🌍 دولار" },
};

const PLANS = [
  {
    id: "starter",
    name: "البداية",
    tagline: "ابدأ التوليد بأساسيات قوية",
    icon: Rocket,
    color: "from-blue-500 to-cyan-600",
    popular: false,
    price: { EGP: 199, SAR: 39, USD: 9 } as Record<Cur, number>,
    features: [
      "المساعد العام (شات كامل) — مجاني دائماً",
      "توليد صور (Nano Banana 2 — سريع)",
      "تعليق صوتي بأصوات Gemini",
      "Magic Brief بلا حدود + استخراج الهوية",
      "أدوات التسويق الكاملة + مكتبة ملفاتي",
    ],
    locked: "لا يشمل: الفيديو · صور Pro · اللاندينج/البرمجة · ElevenLabs",
  },
  {
    id: "pro",
    name: "الاحترافي",
    tagline: "الأنسب لمعظم العملاء",
    icon: Sparkles,
    color: "from-violet-500 to-fuchsia-600",
    popular: true,
    price: { EGP: 349, SAR: 69, USD: 15 } as Record<Cur, number>,
    features: [
      "كل مميزات «البداية»",
      "توليد فيديو (Veo) + صورة بداية ونهاية",
      "صور Pro (جودة عالية) + صور مرجعية متعددة",
      "اللاندينج بيدج + البرمجة (Claude)",
      "أصوات ElevenLabs الاحترافية",
      "تحليل المنافسين + مشاركة المخرجات",
      "حدود أعلى في كل الخدمات",
    ],
    locked: "",
  },
  {
    id: "premium",
    name: "بريميم",
    tagline: "بلا حدود — للاستخدام الكثيف",
    icon: Crown,
    color: "from-amber-500 to-orange-600",
    popular: false,
    price: { EGP: 799, SAR: 149, USD: 35 } as Record<Cur, number>,
    features: [
      "كل مميزات «الاحترافي»",
      "حدود مرتفعة جداً / شبه لا محدودة",
      "أقوى الموديلات (Claude الأقوى · Veo جودة عالية)",
      "أولوية في المعالجة والسرعة",
      "تصدير متقدّم + دعم أولوية",
    ],
    locked: "",
  },
];

export default function PricingPage() {
  const [cur, setCur] = useState<Cur>("EGP");

  return (
    <main className="relative min-h-screen overflow-x-hidden flex flex-col">
      <AnimatedBackground />

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

      <section className="container mx-auto px-4 py-12 sm:py-16">
        <Reveal className="text-center max-w-2xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-bold">باقات تناسب مشروعك</h1>
          <p className="mt-3 text-muted-foreground leading-relaxed">
            الشات مجاني للجميع دائماً. اختر باقةً لفتح التوليد (صور، فيديو، صوت، لاندينج وبرمجة).
          </p>
        </Reveal>

        {/* مبدّل العملة */}
        <div className="mt-7 flex justify-center">
          <div className="inline-flex rounded-xl border bg-card/80 backdrop-blur p-1 gap-1">
            {(Object.keys(CURRENCIES) as Cur[]).map((c) => (
              <button
                key={c}
                onClick={() => setCur(c)}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${cur === c ? "gradient-brand text-white shadow" : "text-muted-foreground hover:text-foreground"}`}
              >
                {CURRENCIES[c].name}
              </button>
            ))}
          </div>
        </div>

        {/* بانر المجاني */}
        <Reveal delay={80} className="mt-8 max-w-3xl mx-auto">
          <div className="rounded-2xl border-2 border-emerald-400/40 bg-emerald-500/10 p-4 flex flex-col sm:flex-row items-center justify-center gap-2 text-center">
            <span className="font-semibold">🆓 المساعد العام (الشات) مجاني للجميع</span>
            <span className="text-sm text-muted-foreground">— بكامل قوته، بدون اشتراك.</span>
          </div>
        </Reveal>

        {/* الباقات: سحب أفقي على الموبايل، 3 أعمدة على الكمبيوتر */}
        <div className="mt-10 flex gap-4 overflow-x-auto snap-x snap-mandatory pb-3 -mx-4 px-4 md:mx-0 md:px-0 md:overflow-visible md:grid md:grid-cols-3 md:items-stretch max-w-5xl lg:mx-auto">
          {PLANS.map((p, i) => (
            <Reveal
              key={p.id}
              delay={i * 90}
              className="min-w-[82%] shrink-0 snap-center md:min-w-0 md:shrink"
            >
              <div className={`relative h-full rounded-2xl border bg-card/85 backdrop-blur-md p-6 flex flex-col shadow-lg ${p.popular ? "border-primary ring-2 ring-primary/30 md:scale-[1.03]" : "border-border/60"}`}>
                {p.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full gradient-brand text-white text-xs font-bold px-3 py-1 shadow">
                    ⭐ الأنسب
                  </span>
                )}
                <div className={`size-12 rounded-xl bg-gradient-to-br ${p.color} grid place-items-center text-white mb-4`}>
                  <p.icon className="size-6" />
                </div>
                <h2 className="text-xl font-bold">{p.name}</h2>
                <p className="text-sm text-muted-foreground mt-1">{p.tagline}</p>

                <div className="mt-4 flex items-end gap-1">
                  <span className="text-3xl sm:text-4xl font-bold text-gradient">{p.price[cur]}</span>
                  <span className="text-sm text-muted-foreground mb-1">{CURRENCIES[cur].label} / شهرياً</span>
                </div>

                <ul className="mt-5 space-y-2.5 flex-1">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                {p.locked && <p className="mt-4 text-xs text-muted-foreground">🔒 {p.locked}</p>}

                <Link
                  href="/signup"
                  className={`mt-6 inline-flex items-center justify-center gap-2 h-12 rounded-xl font-semibold transition-opacity hover:opacity-90 ${p.popular ? "gradient-brand text-white" : "border bg-background"}`}
                >
                  اختر {p.name}
                </Link>
              </div>
            </Reveal>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          💳 الأسعار مؤقتة وللعرض فقط — سيتم تفعيل الدفع وتعدّد العملات قريباً.
        </p>
      </section>

      <SiteFooter />
    </main>
  );
}
