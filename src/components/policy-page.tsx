import Link from "next/link";
import { Brain, ArrowRight, ShieldCheck } from "lucide-react";
import { AnimatedBackground } from "@/components/animated-background";
import { SiteFooter } from "@/components/site-footer";
import { Reveal } from "@/components/reveal";

export type PolicySection = { h: string; items: string[] };

/** قالب موحّد لصفحات السياسات (شروط، خصوصية، اشتراك...) */
export function PolicyPage({
  title,
  intro,
  sections,
  updated = "يونيو 2026",
}: {
  title: string;
  intro: string;
  sections: PolicySection[];
  updated?: string;
}) {
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

      <section className="container mx-auto px-4 py-12 sm:py-16 max-w-3xl">
        <Reveal className="text-center">
          <div className="mx-auto size-16 rounded-2xl gradient-brand grid place-items-center mb-5 animate-float-slow">
            <ShieldCheck className="size-8 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold">{title}</h1>
          <p className="mt-3 text-muted-foreground leading-relaxed">{intro}</p>
          <p className="mt-2 text-xs text-muted-foreground">آخر تحديث: {updated}</p>
        </Reveal>

        <div className="mt-10 space-y-6">
          {sections.map((s, i) => (
            <Reveal key={s.h} delay={i * 50}>
              <div className="rounded-2xl border bg-card/85 backdrop-blur-md p-5 sm:p-6">
                <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                  <span className="size-6 rounded-md gradient-brand text-white grid place-items-center text-xs font-bold shrink-0">{i + 1}</span>
                  {s.h}
                </h2>
                <ul className="space-y-2">
                  {s.items.map((it, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm leading-relaxed text-muted-foreground">
                      <span className="mt-1.5 size-1.5 rounded-full bg-primary shrink-0" />
                      <span>{it}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={120} className="mt-10 text-center text-sm text-muted-foreground">
          <p>
            لأيّ استفسار، تواصل معنا عبر{" "}
            <Link href="/contact" className="text-primary hover:underline font-medium">صفحة التواصل</Link>{" "}
            أو على ojiagency1@gmail.com.
          </p>
        </Reveal>
      </section>

      <SiteFooter />
    </main>
  );
}
