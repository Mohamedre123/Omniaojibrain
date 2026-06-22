import Link from "next/link";
import { Brain, ArrowRight, ShieldCheck } from "lucide-react";
import { AnimatedBackground } from "@/components/animated-background";
import { SiteFooter } from "@/components/site-footer";
import { Reveal } from "@/components/reveal";

export const metadata = {
  title: "سياسة الاسترداد — Oji Brain",
  description: "سياسة استرداد المبالغ والاشتراكات في Oji Brain.",
};

const TERMS = [
  "الاشتراك يبدأ فور إتمام عملية الدفع، ويُتيح لك الوصول الكامل للمزايا المدفوعة طوال مدّة الاشتراك.",
  "يمكنك إلغاء اشتراكك في أيّ وقت من إعدادات الحساب؛ ويستمرّ وصولك للمزايا حتى نهاية الفترة المدفوعة الحالية.",
  "لا تُسترَدّ المبالغ المدفوعة بعد مرور 14 يوماً من تاريخ بدء الاشتراك، حتى في حال الإلغاء.",
  "خلال أول 14 يوماً، يجوز طلب الاسترداد فقط إذا لم تُستخدَم المزايا المدفوعة استخداماً جوهرياً (مثل توليد الصور أو الفيديو أو التعليق الصوتي).",
  "الخدمات التي تُستهلَك فوراً (توليد الصور، الفيديو، التعليق الصوتي) غير قابلة للاسترداد بعد استخدامها لأنها تترتّب عليها تكلفة فعلية.",
  "في حال وجود خطأٍ تقنيٍّ من طرفنا منع تقديم الخدمة، نلتزم بمعالجته أو ردّ قيمة الجزء المتأثّر.",
  "تُعالَج طلبات الاسترداد المؤهّلة خلال مدّةٍ معقولة عبر نفس وسيلة الدفع المستخدمة.",
  "قد تُحدَّث هذه السياسة من وقتٍ لآخر، ويسري التحديث من تاريخ نشره على هذه الصفحة.",
];

export default function RefundPage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden">
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

      <section className="container mx-auto px-4 py-14 sm:py-20 max-w-3xl">
        <Reveal className="text-center">
          <div className="mx-auto size-16 rounded-2xl gradient-brand grid place-items-center mb-5 animate-float-slow">
            <ShieldCheck className="size-8 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold">سياسة الاسترداد</h1>
          <p className="mt-3 text-muted-foreground leading-relaxed">
            نوضّح هنا شروط استرداد المبالغ والاشتراكات بشفافية. باشتراكك في Oji Brain فأنت توافق على هذه الشروط.
          </p>
        </Reveal>

        <Reveal delay={120} className="mt-10">
          <div className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-5 text-center">
            <p className="font-semibold">
              ⚠️ لا تُسترَدّ المبالغ المدفوعة بعد مرور <span className="text-primary">14 يوماً</span> من بدء الاشتراك، حتى لو ألغيت الاشتراك.
            </p>
          </div>
        </Reveal>

        <Reveal delay={200} className="mt-8">
          <ol className="space-y-3">
            {TERMS.map((t, i) => (
              <li key={i} className="flex items-start gap-3 rounded-xl border bg-card p-4">
                <span className="shrink-0 size-6 rounded-full gradient-brand text-white grid place-items-center text-xs font-bold">{i + 1}</span>
                <span className="text-sm leading-relaxed">{t}</span>
              </li>
            ))}
          </ol>
        </Reveal>

        <Reveal delay={260} className="mt-10 text-center text-sm text-muted-foreground">
          <p>
            لأيّ استفسار عن الاسترداد، تواصل معنا عبر{" "}
            <Link href="/contact" className="text-primary hover:underline font-medium">صفحة التواصل</Link>{" "}
            أو على بريد الشكاوى ojiagency1@gmail.com.
          </p>
        </Reveal>
      </section>
      <SiteFooter />
    </main>
  );
}
