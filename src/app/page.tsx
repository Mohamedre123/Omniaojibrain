import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Brain,
  Sparkles,
  Target,
  Palette,
  Video,
  Mic,
  Download,
  Share2,
  Globe,
  Zap,
  Shield,
  ArrowLeft,
} from "lucide-react";

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background">
      {/* خلفية متحرّكة (blobs) */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 -right-24 size-[34rem] max-w-[80vw] rounded-full bg-gradient-to-br from-violet-500/30 to-fuchsia-500/20 blur-3xl animate-blob" />
        <div className="absolute top-1/3 -left-24 size-[30rem] max-w-[80vw] rounded-full bg-gradient-to-br from-blue-500/25 to-cyan-400/15 blur-3xl animate-blob delay-300" />
        <div className="absolute bottom-0 right-1/4 size-[28rem] max-w-[80vw] rounded-full bg-gradient-to-br from-pink-500/20 to-purple-500/10 blur-3xl animate-blob delay-500" />
      </div>

      {/* Nav */}
      <nav className="glass sticky top-0 z-50 border-b safe-top">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="size-9 rounded-lg gradient-brand grid place-items-center animate-float-slow">
              <Brain className="size-5 text-white" />
            </div>
            <span className="text-xl font-bold">Oji Brain</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" className="hidden sm:inline-flex">
              <Link href="/login">تسجيل الدخول</Link>
            </Button>
            <Button asChild variant="ghost" size="icon" className="sm:hidden" aria-label="تسجيل الدخول">
              <Link href="/login"><ArrowLeft className="size-5" /></Link>
            </Button>
            <Button asChild variant="gradient"><Link href="/signup">ابدأ مجاناً</Link></Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="container mx-auto px-4 pt-16 sm:pt-24 pb-24 sm:pb-32 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-accent/50 px-4 py-1.5 text-sm animate-fade-up">
          <Sparkles className="size-4 text-primary" />
          <span>مدعومٌ بأحدث نماذج الذكاء الاصطناعي</span>
        </div>
        <h1 className="mx-auto max-w-4xl text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.15] animate-fade-up delay-100">
          عقلُ مشروعك <span className="text-gradient animate-gradient">الإبداعي</span>
          <br />
          في مكانٍ واحد
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed animate-fade-up delay-200">
          منصةُ ذكاءٍ اصطناعيٍّ تفهمك بأيّ لغةٍ وأيّ لهجة. اشرح فكرة مشروعك، وستحصل على
          <span className="text-foreground font-medium"> استراتيجيةٍ متكاملة</span>،
          <span className="text-foreground font-medium"> تصميماتٍ احترافية</span>، و
          <span className="text-foreground font-medium"> سكربتاتِ فيديو</span> جاهزةً للتنفيذ.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row sm:flex-wrap justify-center gap-3 animate-fade-up delay-300">
          <Button asChild size="lg" variant="gradient" className="h-14 px-8 text-base w-full sm:w-auto">
            <Link href="/signup">
              ابدأ مشروعك الأول
              <ArrowLeft className="size-5" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-14 px-8 text-base w-full sm:w-auto">
            <Link href="#features">استعرض الإمكانيات</Link>
          </Button>
        </div>
        <p className="mt-4 text-sm text-muted-foreground animate-fade-up delay-400">
          مجانيٌّ تماماً • بدون بطاقةٍ ائتمانية • حسابٌ مستقلٌّ لكلّ مستخدم
        </p>

        {/* شريط الإمكانيات السريع */}
        <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto animate-fade-up delay-500">
          {[
            { icon: Palette, label: "توليدُ صور" },
            { icon: Video, label: "توليدُ فيديو" },
            { icon: Mic, label: "تعليقٌ صوتي" },
            { icon: Target, label: "استراتيجيات" },
          ].map((q) => (
            <div key={q.label} className="hover-lift rounded-xl border bg-card/60 backdrop-blur p-4 flex flex-col items-center gap-2">
              <q.icon className="size-6 text-primary" />
              <span className="text-sm font-medium">{q.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* الأرقام */}
      <section className="container mx-auto px-4 pb-20">
        <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto text-center">
          {[
            { n: "+6", t: "لهجات يفهمها" },
            { n: "24/7", t: "متاحٌ دائماً" },
            { n: "∞", t: "مشاريع بلا حدود" },
          ].map((s) => (
            <div key={s.t} className="rounded-2xl border bg-card/60 backdrop-blur p-5">
              <div className="text-3xl sm:text-4xl font-bold text-gradient">{s.n}</div>
              <div className="mt-1 text-xs sm:text-sm text-muted-foreground">{s.t}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-secondary/30 py-20 sm:py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl sm:text-4xl font-bold">كلُّ ما يحتاجه مشروعك</h2>
            <p className="mt-3 text-muted-foreground">من الفكرة إلى التنفيذ — منظومةُ عملٍ متكاملةٌ في منصةٍ واحدة</p>
          </div>
          <div className="mt-14 grid gap-5 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="group hover-lift rounded-2xl border bg-card p-6 hover:shadow-xl hover:border-primary/40">
                <div className="mb-4 inline-grid size-12 place-items-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-110 group-hover:rotate-3">
                  <f.icon className="size-6" />
                </div>
                <h3 className="text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="container mx-auto px-4 py-20 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl sm:text-4xl font-bold">كيف يعمل؟</h2>
          <p className="mt-3 text-muted-foreground">ثلاثُ خطواتٍ بسيطةٍ بين الفكرة والتنفيذ</p>
        </div>
        <div className="mt-16 grid gap-8 sm:grid-cols-3">
          {[
            { n: "1", t: "اشرح فكرة مشروعك", d: "أدخل وصفاً موجزاً، واختر نوع نشاطك من القوالب الجاهزة" },
            { n: "2", t: "اختر الوضع المناسب", d: "استراتيجيةٌ متكاملة، تصميمات، أو فيديو إعلاني — أو محادثةٌ حرّة" },
            { n: "3", t: "حمّل النتائج واستخدمها", d: "صدّر المخرجات بصيغة PDF أو نص، وشارك المشروع مع عميلك" },
          ].map((s) => (
            <div key={s.n} className="relative hover-lift rounded-2xl border bg-card p-8 pt-10">
              <div className="absolute -top-5 right-6 size-12 rounded-full gradient-brand grid place-items-center text-white text-xl font-bold shadow-lg">
                {s.n}
              </div>
              <h3 className="mt-2 text-xl font-bold">{s.t}</h3>
              <p className="mt-2 text-muted-foreground leading-relaxed">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 pb-24">
        <div className="relative overflow-hidden rounded-3xl gradient-brand p-8 sm:p-12 text-center text-white">
          <div aria-hidden className="absolute inset-0 animate-shine" />
          <div className="relative">
            <h2 className="text-3xl sm:text-4xl font-bold">جاهزٌ للبدء؟</h2>
            <p className="mt-3 text-white/90 max-w-xl mx-auto">
              افتح حسابك الآن وابدأ مشروعك الأول في أقلَّ من دقيقة.
            </p>
            <Button asChild size="lg" variant="secondary" className="mt-8 h-14 px-10 text-base w-full sm:w-auto">
              <Link href="/signup">
                أنشئ حسابك مجاناً
                <ArrowLeft className="size-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 safe-bottom">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Oji Brain — جزءٌ من Oji
        </div>
      </footer>
    </main>
  );
}

const FEATURES = [
  { icon: Target, title: "استراتيجيةُ تسويقٍ متكاملة", description: "خطةٌ شهريةٌ أو ربعُ سنويةٍ بأهدافٍ ومحتوًى ومنصاتٍ وميزانية، قابلةٌ للتنفيذ تفصيلياً." },
  { icon: Palette, title: "توليدُ صورٍ احترافية", description: "صورٌ تسويقيةٌ واقعيةٌ بالذكاء الاصطناعي (Nano Banana Pro) — بأيّ أبعادٍ تناسب منصّاتك." },
  { icon: Video, title: "توليدُ فيديو إعلاني", description: "فيديوهاتٌ بجودةٍ عالية (Veo) من نصٍّ أو من صورة — جاهزةٌ للريلز والإعلانات." },
  { icon: Globe, title: "يفهم جميع اللهجات", description: "اكتب بالمصرية، الخليجية، الشامية، المغربية، الفصحى، أو الإنجليزية — والذكاء الاصطناعي يردّ بنفس لهجتك." },
  { icon: Mic, title: "تعليقٌ صوتي وإدخالٌ صوتي", description: "حوّل كلامك إلى نص، وحوّل نصوصك إلى تعليقٍ صوتيٍّ احترافيٍّ بأصواتٍ متعددة." },
  { icon: Shield, title: "حسابك خاصٌّ بك", description: "كلُّ حسابٍ معزولٌ تماماً بنظام أمانٍ متعدد الطبقات — لا أحدَ يصل إلى مشاريعك." },
  { icon: Download, title: "تحميلٌ وتصدير", description: "PDF احترافي، نصوص، صور، فيديو — جميع المخرجات تُحفظ في مكتبتك وتحت تصرّفك." },
  { icon: Share2, title: "شاركها مع عميلك", description: "أرسل رابطاً للعميل النهائي ليطّلع على الاستراتيجية والمخرجات دون إنشاء حساب." },
  { icon: Zap, title: "سرعةٌ دون انقطاع", description: "ردودٌ فوريةٌ تظهر أثناء القراءة، دون رسومِ اشتراكٍ أو حدودِ استخدامٍ مزعجة." },
];
