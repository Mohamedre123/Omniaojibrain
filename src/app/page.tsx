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
    <main className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="glass sticky top-0 z-50 border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="size-9 rounded-lg gradient-brand grid place-items-center">
              <Brain className="size-5 text-white" />
            </div>
            <span className="text-xl font-bold">Oji Brain</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost"><Link href="/login">تسجيل الدخول</Link></Button>
            <Button asChild variant="gradient"><Link href="/signup">ابدأ مجاناً</Link></Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="container mx-auto px-4 pt-20 pb-32 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-accent/50 px-4 py-1.5 text-sm">
          <Sparkles className="size-4 text-primary" />
          <span>مدعوم بأحدث نماذج الذكاء الاصطناعي</span>
        </div>
        <h1 className="mx-auto max-w-4xl text-5xl md:text-7xl font-bold tracking-tight leading-[1.1]">
          عقل مشروعك <span className="text-gradient">الإبداعي</span>
          <br />
          في مكانٍ واحد
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed">
          منصةُ ذكاءٍ اصطناعيٍّ تفهمك بأيّ لغةٍ وأيّ لهجة. اشرح فكرة مشروعك، وستحصل على
          <span className="text-foreground font-medium"> استراتيجيةٍ متكاملة</span>،
          <span className="text-foreground font-medium"> تصميماتٍ احترافية</span>، و
          <span className="text-foreground font-medium"> سكربتاتِ فيديو</span> جاهزةً للتنفيذ.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg" variant="gradient" className="h-14 px-8 text-base">
            <Link href="/signup">
              ابدأ مشروعك الأول
              <ArrowLeft className="size-5" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-14 px-8 text-base">
            <Link href="#features">استعرض الإمكانيات</Link>
          </Button>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">مجانيٌّ تماماً • بدون بطاقةٍ ائتمانية • حسابٌ مستقلٌّ لكلّ مستخدم</p>
      </section>

      {/* Features */}
      <section id="features" className="bg-secondary/30 py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-4xl font-bold">كلُّ ما يحتاجه مشروعك</h2>
            <p className="mt-3 text-muted-foreground">من الفكرة إلى التنفيذ — منظومةُ عملٍ متكاملةٌ في منصةٍ واحدة</p>
          </div>
          <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="group rounded-2xl border bg-card p-6 transition-all hover:shadow-lg hover:-translate-y-1">
                <div className="mb-4 inline-grid size-12 place-items-center rounded-xl bg-primary/10 text-primary">
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
      <section className="container mx-auto px-4 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-4xl font-bold">كيف يعمل؟</h2>
          <p className="mt-3 text-muted-foreground">ثلاثُ خطواتٍ بسيطةٍ بين الفكرة والتنفيذ</p>
        </div>
        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {[
            { n: "1", t: "اشرح فكرة مشروعك", d: "أدخل وصفاً موجزاً، واختر نوع نشاطك من القوالب الجاهزة" },
            { n: "2", t: "اختر الوضع المناسب", d: "استراتيجيةٌ متكاملة، تصميمات، أو فيديو إعلاني — أو محادثةٌ حرّة" },
            { n: "3", t: "حمّل النتائج واستخدمها", d: "صدّر المخرجات بصيغة PDF أو نص، وشارك المشروع مع عميلك" },
          ].map((s) => (
            <div key={s.n} className="relative rounded-2xl border bg-card p-8">
              <div className="absolute -top-5 right-6 size-12 rounded-full gradient-brand grid place-items-center text-white text-xl font-bold shadow-lg">
                {s.n}
              </div>
              <h3 className="mt-4 text-xl font-bold">{s.t}</h3>
              <p className="mt-2 text-muted-foreground leading-relaxed">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 pb-24">
        <div className="rounded-3xl gradient-brand p-12 text-center text-white">
          <h2 className="text-4xl font-bold">جاهزٌ للبدء؟</h2>
          <p className="mt-3 text-white/90 max-w-xl mx-auto">
            افتح حسابك الآن وابدأ مشروعك الأول في أقلَّ من دقيقة.
          </p>
          <Button asChild size="lg" variant="secondary" className="mt-8 h-14 px-10 text-base">
            <Link href="/signup">
              أنشئ حسابك مجاناً
              <ArrowLeft className="size-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Oji Brain — جزءٌ من Oji
        </div>
      </footer>
    </main>
  );
}

const FEATURES = [
  { icon: Target, title: "استراتيجيةُ تسويقٍ متكاملة", description: "خطةٌ شهريةٌ أو ربعُ سنويةٍ بأهدافٍ ومحتوًى ومنصاتٍ وميزانية، قابلةٌ للتنفيذ تفصيلياً." },
  { icon: Palette, title: "برومبتاتُ تصميمٍ احترافية", description: "ارفع صورة منتجك أو اشرح فكرتك، واحصل على برومبتاتٍ جاهزةٍ لـ Midjourney و DALL-E و Flux." },
  { icon: Video, title: "برومبتاتُ فيديو لكلّ المنصات", description: "Text-to-video، Image-to-video، Start/End Frame — لـ Veo و Runway و Kling." },
  { icon: Globe, title: "يفهم جميع اللهجات", description: "اكتب بالمصرية، الخليجية، الشامية، المغربية، الفصحى، أو الإنجليزية — والذكاء الاصطناعي يردّ بنفس اللهجة." },
  { icon: Mic, title: "إدخالٌ صوتي", description: "زرُّ ميكروفونٍ يحوّل كلامك إلى نصٍّ مكتوب — أدخل أفكارك بسهولة." },
  { icon: Shield, title: "حسابك خاصٌّ بك", description: "كلُّ حسابٍ معزولٌ تماماً. لا أحدَ يستطيع الوصول إلى مشاريعك بنظام أمانٍ متعدد الطبقات." },
  { icon: Download, title: "تحميلٌ وتصدير", description: "PDF احترافي، نصوص، صور — جميع المخرجات تحت تصرّفك متى شئت." },
  { icon: Share2, title: "شاركها مع عميلك", description: "أرسل رابطاً للعميل النهائي ليطّلع على الاستراتيجية والمخرجات دون الحاجة لإنشاء حساب." },
  { icon: Zap, title: "سرعةٌ دون انقطاع", description: "ردودٌ فوريةٌ تظهر أثناء القراءة، دون رسومِ اشتراكٍ أو حدودِ استخدامٍ مزعجة." },
];
