import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/reveal";
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
  Check,
  Star,
} from "lucide-react";

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background">
      {/* خلفية متحرّكة */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-[0.4]" />
        {/* كرات لونية تتحرّك ببطء */}
        <div className="absolute -top-28 -right-20 size-[38rem] max-w-[88vw] rounded-full bg-gradient-to-br from-violet-600/45 to-fuchsia-500/30 blur-3xl animate-blob" />
        <div className="absolute top-1/3 -left-20 size-[34rem] max-w-[88vw] rounded-full bg-gradient-to-br from-blue-600/40 to-cyan-400/25 blur-3xl animate-blob delay-300" />
        <div className="absolute -bottom-10 right-1/4 size-[32rem] max-w-[85vw] rounded-full bg-gradient-to-br from-pink-600/35 to-purple-500/25 blur-3xl animate-blob delay-500" />
        <div className="absolute top-1/4 left-1/3 size-[24rem] max-w-[70vw] rounded-full bg-gradient-to-br from-emerald-500/25 to-teal-400/15 blur-3xl animate-blob delay-700" />
        {/* أشكال عائمة خفيفة */}
        <div className="absolute top-28 left-[8%] size-24 rounded-full border border-primary/25 animate-float" />
        <div className="absolute top-[55%] right-[10%] size-16 rounded-2xl border border-fuchsia-400/25 rotate-12 animate-float-slow" />
        <div className="absolute bottom-24 left-[20%] size-3 rounded-full bg-primary/40 animate-float-slow" />
        <div className="absolute top-[40%] right-[28%] size-2.5 rounded-full bg-fuchsia-400/50 animate-float" />
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
          <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="#features" className="hover:text-foreground transition-colors">الإمكانيات</Link>
            <Link href="#how" className="hover:text-foreground transition-colors">كيف يعمل</Link>
            <Link href="#faq" className="hover:text-foreground transition-colors">الأسئلة</Link>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" className="hidden sm:inline-flex">
              <Link href="/login">تسجيل الدخول</Link>
            </Button>
            <Button asChild variant="gradient"><Link href="/signup">ابدأ مجاناً</Link></Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="container mx-auto px-4 pt-16 sm:pt-24 pb-16 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-accent/50 px-4 py-1.5 text-sm animate-fade-up">
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60" />
            <span className="relative inline-flex size-2 rounded-full bg-primary" />
          </span>
          <span>مدعومٌ بأحدث نماذج الذكاء الاصطناعي — Nano Banana 2 و Veo</span>
        </div>
        <h1 className="mx-auto max-w-4xl text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.15] animate-fade-up delay-100">
          عقلُ مشروعك <span className="text-gradient animate-gradient">الإبداعي</span>
          <br />
          في مكانٍ واحد
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed animate-fade-up delay-200">
          منصةُ ذكاءٍ اصطناعيٍّ تفهمك بأيّ لغةٍ ولهجة. اشرح فكرتك، واحصل على
          <span className="text-foreground font-medium"> استراتيجية</span>،
          <span className="text-foreground font-medium"> صورٍ وفيديوهاتٍ احترافية</span>، و
          <span className="text-foreground font-medium"> محتوًى جاهز</span> للتنفيذ.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row sm:flex-wrap justify-center gap-3 animate-fade-up delay-300">
          <Button asChild size="lg" variant="gradient" className="h-14 px-8 text-base w-full sm:w-auto hover-lift">
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
          مجانيٌّ للبدء • بدون بطاقةٍ ائتمانية • حسابٌ مستقلٌّ لكلّ مستخدم
        </p>

        {/* معاينة تفاعلية للتطبيق */}
        <Reveal delay={150} className="mt-16 max-w-4xl mx-auto">
          <div className="relative">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* صورة إعلانية — موك أب واضح لإعلان */}
              <div className="gradient-border rounded-2xl p-5 text-right hover-lift sm:translate-y-4">
                <div className="size-11 rounded-xl bg-rose-500/15 text-rose-500 grid place-items-center mb-3"><Palette className="size-6" /></div>
                <h3 className="font-semibold">صورة إعلانية</h3>
                <p className="text-xs text-muted-foreground mt-1">من وصفٍ بسيط → صورة احترافية في ثوانٍ</p>
                <div className="mt-3 h-28 rounded-lg overflow-hidden relative bg-gradient-to-br from-amber-300 via-orange-400 to-rose-500">
                  <div className="absolute inset-0 animate-shine" />
                  <span className="absolute top-2 right-2 rounded-md bg-black/45 text-white text-[10px] px-2 py-0.5 font-bold backdrop-blur">خصم ٥٠٪</span>
                  <div className="absolute bottom-3 left-3 size-12 rounded-full bg-white/35 backdrop-blur-sm ring-2 ring-white/40" />
                  <div className="absolute bottom-4 right-3 text-white text-[11px] font-bold drop-shadow-md leading-tight text-right">
                    عرض رمضان<br /><span className="text-[9px] font-medium opacity-90">منتجك بإضاءة فاخرة</span>
                  </div>
                </div>
              </div>

              {/* خطة تسويق — مقتطف مقروء */}
              <div className="gradient-border rounded-2xl p-5 text-right hover-lift">
                <div className="size-11 rounded-xl bg-violet-500/15 text-violet-500 grid place-items-center mb-3"><Target className="size-6" /></div>
                <h3 className="font-semibold">خطة تسويق</h3>
                <p className="text-xs text-muted-foreground mt-1">خطة شهرية كاملة بمحتوًى وميزانية ومنصّات</p>
                <div className="mt-3 space-y-2 text-[11px] text-right">
                  <div className="flex items-center justify-end gap-1.5"><span>الأسبوع ١: حملة إطلاق</span><span className="size-1.5 rounded-full bg-violet-500 shrink-0" /></div>
                  <div className="flex items-center justify-end gap-1.5"><span>٣ منشورات + ريلز أسبوعياً</span><span className="size-1.5 rounded-full bg-blue-500 shrink-0" /></div>
                  <div className="flex items-center justify-end gap-1.5"><span>ميزانية إعلانات: ٥٠٠ ر.س</span><span className="size-1.5 rounded-full bg-emerald-500 shrink-0" /></div>
                  <div className="flex items-center justify-end gap-1.5"><span>الهدف: ‎+٣٠٪ وصول</span><span className="size-1.5 rounded-full bg-amber-500 shrink-0" /></div>
                </div>
              </div>

              {/* فيديو إعلاني */}
              <div className="gradient-border rounded-2xl p-5 text-right hover-lift sm:translate-y-4">
                <div className="size-11 rounded-xl bg-blue-500/15 text-blue-500 grid place-items-center mb-3"><Video className="size-6" /></div>
                <h3 className="font-semibold">فيديو إعلاني</h3>
                <p className="text-xs text-muted-foreground mt-1">فيديو بجودة عالية من وصفٍ أو صورة</p>
                <div className="mt-3 h-28 rounded-lg relative overflow-hidden bg-gradient-to-br from-slate-800 via-blue-900 to-cyan-700">
                  <div className="absolute inset-0 animate-shine" />
                  <div className="absolute inset-0 grid place-items-center">
                    <div className="size-10 rounded-full bg-white/90 grid place-items-center shadow-lg">
                      <div className="ml-0.5 size-0 border-y-[7px] border-y-transparent border-l-[12px] border-l-blue-600" />
                    </div>
                  </div>
                  <span className="absolute bottom-2 left-2 rounded bg-black/50 text-white text-[9px] px-1.5 py-0.5 font-mono">00:08</span>
                  <span className="absolute bottom-2 right-2 text-white/90 text-[10px] font-semibold">9:16 • HD</span>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* شريط الإمكانيات المتحرّك */}
      <section className="py-6 border-y bg-secondary/20">
        <div className="marquee-mask overflow-hidden">
          <div className="flex gap-3 w-max animate-marquee">
            {[...CAPS, ...CAPS].map((c, i) => (
              <span key={i} className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm whitespace-nowrap">
                <c.icon className="size-4 text-primary" /> {c.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* الأرقام */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto text-center">
          {[
            { n: "+6", t: "لهجات يفهمها" },
            { n: "24/7", t: "متاحٌ دائماً" },
            { n: "∞", t: "مشاريع بلا حدود" },
          ].map((s, i) => (
            <Reveal key={s.t} delay={i * 100}>
              <div className="gradient-border rounded-2xl p-5">
                <div className="text-3xl sm:text-4xl font-bold text-gradient">{s.n}</div>
                <div className="mt-1 text-xs sm:text-sm text-muted-foreground">{s.t}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 sm:py-24">
        <div className="container mx-auto px-4">
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl sm:text-4xl font-bold">كلُّ ما يحتاجه مشروعك</h2>
            <p className="mt-3 text-muted-foreground">من الفكرة إلى التنفيذ — منظومةٌ متكاملةٌ في منصةٍ واحدة</p>
          </Reveal>
          <div className="mt-14 grid gap-5 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={(i % 3) * 100}>
                <div className="group hover-lift rounded-2xl border bg-card p-6 h-full hover:shadow-xl hover:border-primary/40">
                  <div className={`mb-4 inline-grid size-12 place-items-center rounded-xl ${f.bg} transition-transform group-hover:scale-110 group-hover:-rotate-3`}>
                    <f.icon className="size-6" />
                  </div>
                  <h3 className="text-lg font-semibold">{f.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="bg-secondary/30 py-20 sm:py-24">
        <div className="container mx-auto px-4">
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl sm:text-4xl font-bold">كيف يعمل؟</h2>
            <p className="mt-3 text-muted-foreground">ثلاثُ خطواتٍ بسيطةٍ بين الفكرة والتنفيذ</p>
          </Reveal>
          <div className="mt-16 grid gap-8 sm:grid-cols-3 relative">
            {[
              { n: "1", t: "اشرح فكرتك", d: "أدخل وصفاً موجزاً أو رابط موقعك، واختر نوع نشاطك" },
              { n: "2", t: "اختر الأداة", d: "استراتيجية، صور، فيديو، أو محادثةٌ حرّة مع المساعد" },
              { n: "3", t: "حمّل ونفّذ", d: "كلّ مخرجاتك تُحفظ في مكتبتك وتتزامن على أجهزتك" },
            ].map((s, i) => (
              <Reveal key={s.n} delay={i * 120}>
                <div className="relative hover-lift rounded-2xl border bg-card p-8 pt-10 h-full">
                  <div className="absolute -top-5 right-6 size-12 rounded-full gradient-brand grid place-items-center text-white text-xl font-bold shadow-lg">
                    {s.n}
                  </div>
                  <h3 className="mt-2 text-xl font-bold">{s.t}</h3>
                  <p className="mt-2 text-muted-foreground leading-relaxed">{s.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="container mx-auto px-4 py-20 sm:py-24">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl sm:text-4xl font-bold">ثقةٌ من صُنّاع المحتوى</h2>
          <p className="mt-3 text-muted-foreground">أدواتٌ تختصر ساعاتٍ من العمل اليومي</p>
        </Reveal>
        <div className="mt-12 grid gap-5 sm:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <Reveal key={t.name} delay={i * 100}>
              <div className="rounded-2xl border bg-card p-6 h-full hover-lift">
                <div className="flex gap-0.5 text-amber-400 mb-3">
                  {Array.from({ length: 5 }).map((_, j) => <Star key={j} className="size-4 fill-current" />)}
                </div>
                <p className="text-sm leading-relaxed">{t.quote}</p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="size-9 rounded-full gradient-brand grid place-items-center text-white text-sm font-bold">{t.name[0]}</div>
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* FAQ — تفاعلي */}
      <section id="faq" className="container mx-auto px-4 py-20 sm:py-24">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl sm:text-4xl font-bold">أسئلةٌ شائعة</h2>
          <p className="mt-3 text-muted-foreground">كلُّ ما تريد معرفته قبل أن تبدأ</p>
        </Reveal>
        <div className="mt-10 max-w-2xl mx-auto space-y-3">
          {FAQ.map((f, i) => (
            <Reveal key={f.q} delay={i * 60}>
              <details className="group rounded-xl border bg-card px-5 py-4 [&_summary]:cursor-pointer">
                <summary className="flex items-center justify-between gap-3 font-medium list-none">
                  {f.q}
                  <span className="size-6 rounded-full border grid place-items-center text-muted-foreground transition-transform group-open:rotate-45 shrink-0">+</span>
                </summary>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{f.a}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 pb-24">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl gradient-brand p-8 sm:p-14 text-center text-white">
            <div aria-hidden className="absolute inset-0 animate-shine" />
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-bold">جاهزٌ للبدء؟</h2>
              <p className="mt-3 text-white/90 max-w-xl mx-auto">
                افتح حسابك الآن وابدأ مشروعك الأول في أقلَّ من دقيقة.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-3">
                <Button asChild size="lg" variant="secondary" className="h-14 px-10 text-base w-full sm:w-auto">
                  <Link href="/signup">
                    أنشئ حسابك مجاناً
                    <ArrowLeft className="size-5" />
                  </Link>
                </Button>
              </div>
              <div className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-white/85">
                {["بدون بطاقة ائتمانية", "إلغاء في أي وقت", "بياناتك معزولةٌ وآمنة"].map((x) => (
                  <span key={x} className="inline-flex items-center gap-1.5"><Check className="size-4" /> {x}</span>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Footer */}
      <footer className="border-t py-10 safe-bottom">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-md gradient-brand grid place-items-center"><Brain className="size-4 text-white" /></div>
            <span className="font-semibold text-foreground">Oji Brain</span>
          </div>
          <p>© {new Date().getFullYear()} Oji Brain — جزءٌ من Oji</p>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hover:text-foreground transition-colors">دخول</Link>
            <Link href="/signup" className="hover:text-foreground transition-colors">حساب جديد</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

const CAPS = [
  { icon: Palette, label: "توليد صور" },
  { icon: Video, label: "توليد فيديو" },
  { icon: Target, label: "استراتيجيات تسويق" },
  { icon: Mic, label: "تعليق صوتي" },
  { icon: Globe, label: "كل اللهجات" },
  { icon: Sparkles, label: "تحليل المنافسين" },
  { icon: Share2, label: "مشاركة مع العميل" },
  { icon: Download, label: "تصدير PDF" },
];

const FEATURES = [
  { icon: Target, bg: "bg-violet-500/15 text-violet-500", title: "استراتيجيةُ تسويقٍ متكاملة", description: "خطةٌ شهريةٌ أو ربعُ سنويةٍ بأهدافٍ ومحتوًى ومنصاتٍ وميزانية، قابلةٌ للتنفيذ تفصيلياً." },
  { icon: Palette, bg: "bg-rose-500/15 text-rose-500", title: "توليدُ صورٍ احترافية", description: "صورٌ واقعيةٌ بالذكاء الاصطناعي (Nano Banana 2) — بأيّ أبعادٍ تناسب منصّاتك." },
  { icon: Video, bg: "bg-blue-500/15 text-blue-500", title: "توليدُ فيديو إعلاني", description: "فيديوهاتٌ بجودةٍ عالية (Veo) من نصٍّ أو من صورة — جاهزةٌ للريلز والإعلانات." },
  { icon: Globe, bg: "bg-emerald-500/15 text-emerald-500", title: "يفهم جميع اللهجات", description: "اكتب بالمصرية، الخليجية، الشامية، المغربية، الفصحى، أو الإنجليزية — ويردّ بنفس لهجتك." },
  { icon: Mic, bg: "bg-amber-500/15 text-amber-600", title: "تعليقٌ صوتي", description: "حوّل نصوصك إلى تعليقٍ صوتيٍّ احترافيٍّ بأصواتٍ متعددة، وكلامك إلى نص." },
  { icon: Shield, bg: "bg-cyan-500/15 text-cyan-500", title: "حسابك خاصٌّ بك", description: "كلُّ حسابٍ معزولٌ تماماً بنظام أمانٍ متعدد الطبقات — لا أحدَ يصل إلى مشاريعك." },
  { icon: Download, bg: "bg-indigo-500/15 text-indigo-500", title: "تحميلٌ وتصدير", description: "PDF احترافي، نصوص، صور، فيديو — كلُّ المخرجات تُحفظ في مكتبتك." },
  { icon: Share2, bg: "bg-pink-500/15 text-pink-500", title: "شاركها مع عميلك", description: "أرسل رابطاً للعميل النهائي ليطّلع على الاستراتيجية والمخرجات دون إنشاء حساب." },
  { icon: Zap, bg: "bg-fuchsia-500/15 text-fuchsia-500", title: "سرعةٌ دون انقطاع", description: "ردودٌ فوريةٌ تظهر أثناء القراءة، دون رسومِ اشتراكٍ أو حدودِ استخدامٍ مزعجة." },
];

const TESTIMONIALS = [
  { name: "سارة", role: "صاحبة متجر إلكتروني", quote: "بقيت أطلّع تصاميم وإعلانات في دقايق بدل ما أستنى مصمّم. وفّرت عليّ وقت ومجهود كبير." },
  { name: "خالد", role: "مسوّق رقمي — الرياض", quote: "الاستراتيجيات مفصّلة وعملية، وبيفهم السوق الخليجي صح. أداة أساسية في شغلي اليومي." },
  { name: "ليلى", role: "مديرة محتوى", quote: "إني أكلّمه بلهجتي ويرد بنفس الأسلوب خلّى الشغل أسهل بكتير. والصور بجودة احترافية." },
];

const FAQ = [
  { q: "هل أحتاج خبرةً تقنية؟", a: "إطلاقاً. اكتب فكرتك بلغتك العادية، والباقي على Oji — يفهم كلامك وينفّذ." },
  { q: "هل بياناتي ومشاريعي آمنة؟", a: "نعم. كلُّ حسابٍ معزولٌ تماماً بنظام أمانٍ متعدد الطبقات، ولا يمكن لأحدٍ الوصول إلى بياناتك." },
  { q: "هل يكتب بلهجتي؟", a: "أيوه — اكتب بالمصرية أو الخليجية أو الشامية أو المغربية أو الفصحى أو الإنجليزية، ويرد بنفس لهجتك." },
  { q: "هل المخرجات تُحفظ؟", a: "كلُّ الصور والفيديوهات والمحادثات تُحفظ تلقائياً في مكتبتك وتتزامن على كلّ أجهزتك." },
  { q: "هل يعمل على الموبايل؟", a: "نعم، الموقع متجاوبٌ بالكامل ويعمل على iOS و Android و الكمبيوتر و الماك وكلّ الأجهزة." },
];
