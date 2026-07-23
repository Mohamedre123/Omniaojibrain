import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Megaphone, Hash, Shuffle, Mail, MessageCircle, Calendar as CalendarIcon, Share2, Recycle, GalleryHorizontalEnd, Clapperboard, Tag, Quote, PackageOpen, MessagesSquare, Gift, ScanText, Captions, Languages, CalendarDays, UtensilsCrossed, Smartphone, Camera, CreditCard, MessageSquareQuote, LayoutTemplate, Ticket } from "lucide-react";

const TOOLS = [
  { href: "/marketing/repurpose", icon: Recycle, title: "إعادة تدوير المحتوى", description: "فكرة واحدة → بوست + ريلز + ستوري + تغريدة + إيميل + هاشتاجات", color: "from-teal-500 to-emerald-600", badge: "✨ جديد" },
  { href: "/marketing/carousel", icon: GalleryHorizontalEnd, title: "تصميم كاروسيل", description: "موضوع → كاروسيل 5–7 شرائح جاهزة للتصميم", color: "from-fuchsia-500 to-pink-600", badge: "✨ جديد" },
  { href: "/marketing/video-pack", icon: Clapperboard, title: "قوالب فيديو جاهزة", description: "سكربت + برومبتات فيديو + Start/End frame + موسيقى", color: "from-blue-500 to-indigo-600", badge: "✨ جديد" },
  { href: "/marketing/names", icon: Tag, title: "مولّد الأسماء التجارية", description: "12 اسماً لعلامتك/منتجك مع اقتراح دومين", color: "from-amber-500 to-orange-600", badge: "✨ جديد" },
  { href: "/marketing/slogans", icon: Quote, title: "مولّد الشعارات", description: "10 شعارات قصيرة وجذّابة", color: "from-pink-500 to-rose-600", badge: "✨ جديد" },
  { href: "/marketing/product-desc", icon: PackageOpen, title: "وصف منتج للمتاجر", description: "وصف بيعي + SEO لسلة/زد/إنستجرام", color: "from-cyan-500 to-blue-600", badge: "✨ جديد" },
  { href: "/marketing/replies", icon: MessagesSquare, title: "الردّ على العملاء", description: "ردود مهذّبة على التعليقات والتقييمات", color: "from-violet-500 to-purple-600", badge: "✨ جديد" },
  { href: "/marketing/ad-copy", icon: Megaphone, title: "نصوص إعلانات (Google & Meta)", description: "عناوين ووصف إعلانات جاهزة", color: "from-red-500 to-orange-600", badge: "✨ جديد" },
  { href: "/marketing/contests", icon: Gift, title: "أفكار مسابقات وجيف أواي", description: "5 أفكار + نص منشور جاهز", color: "from-lime-500 to-green-600", badge: "✨ جديد" },
  { href: "/marketing/menu", icon: UtensilsCrossed, title: "مصمّم المنيو / قائمة الأسعار", description: "لوجو + ألوان علامتك + أقسام ومنتجات وأسعار → صورة", color: "from-orange-500 to-red-600", badge: "✨ جديد" },
  { href: "/marketing/caption", icon: Captions, title: "كابشن + هاشتاجات من صورة", description: "ارفع صورة → كابشن وهاشتاجات جاهزة", color: "from-pink-500 to-rose-600", badge: "✨ جديد" },
  { href: "/marketing/image-to-prompt", icon: ScanText, title: "صورة → برومبت", description: "ارفع صورة → البرومبت اللي يعيدها", color: "from-slate-500 to-gray-700", badge: "✨ جديد" },
  { href: "/marketing/translate", icon: Languages, title: "تحويل بين اللهجات", description: "نصّ → مصري/خليجي/شامي/فصحى/English", color: "from-cyan-500 to-blue-600", badge: "✨ جديد" },
  { href: "/marketing/month-plan", icon: CalendarDays, title: "خطة محتوى 30 يوم", description: "شهر كامل بوستات جاهزة", color: "from-violet-500 to-indigo-600", badge: "✨ جديد" },
  { href: "/marketing/mockups", icon: Smartphone, title: "مولّد الموكب (Mockups)", description: "تصميمك على موبايل/موقع/تيشيرت/مج/بوستر/لوحة", color: "from-slate-500 to-gray-700", badge: "✨ جديد" },
  { href: "/marketing/photoshoot", icon: Camera, title: "ثيمات جلسة تصوير المنتج", description: "ارفع منتجك → مشاهد جاهزة (رمضان/فخامة/مينيمال/صيف)", color: "from-amber-500 to-yellow-600", badge: "✨ جديد" },
  { href: "/marketing/card", icon: CreditCard, title: "بطاقة عمل + بانرات سوشيال", description: "تصميم واحد → بطاقة وأغلفة كل المنصّات", color: "from-indigo-500 to-blue-600", badge: "✨ جديد" },
  { href: "/marketing/review-card", icon: MessageSquareQuote, title: "جرافيك تقييمات العملاء", description: "ريفيو عميلك → صورة أنيقة للنشر", color: "from-teal-500 to-cyan-600", badge: "✨ جديد" },
  { href: "/marketing/story-cover", icon: LayoutTemplate, title: "أغلفة ستوري / ريلز", description: "غلاف 9:16 احترافي لقصصك وريلزك", color: "from-fuchsia-500 to-purple-600", badge: "✨ جديد" },
  { href: "/marketing/coupon", icon: Ticket, title: "كوبونات وعروض بصرية", description: "كود خصم أنيق جاهز للنشر", color: "from-rose-500 to-red-600", badge: "✨ جديد" },
  { href: "/marketing/publisher", icon: Share2, title: "النشر المباشر", description: "انشر على واتساب/فيسبوك/تويتر/لينكدإن من مكان واحد", color: "from-emerald-500 to-green-600", badge: "🚀 جديد" },
  { href: "/marketing/hashtags", icon: Hash, title: "مولّد هاشتاجات ذكي", description: "30 هاشتاج مقسّمة بحسب الحجم والمجال", color: "from-blue-500 to-cyan-600" },
  { href: "/marketing/variations", icon: Shuffle, title: "A/B Variations", description: "5 نسخ من نفس النصّ بأساليبَ مختلفة", color: "from-violet-500 to-purple-600" },
  { href: "/marketing/email", icon: Mail, title: "Email Marketing", description: "قوالب إيميل + sequences ترحيب ومتابعة", color: "from-rose-500 to-pink-600" },
  { href: "/marketing/whatsapp", icon: MessageCircle, title: "WhatsApp Business Templates", description: "رسائل ترويجية تلتزم بشروط WhatsApp", color: "from-orange-500 to-amber-600" },
  { href: "/calendar", icon: CalendarIcon, title: "Content Calendar", description: "تقويم محتوًى تفاعلي شهري", color: "from-indigo-500 to-purple-600" },
];

export default function MarketingHubPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Megaphone className="size-7 text-primary" />
          التسويق
        </h1>
        <p className="text-muted-foreground mt-2">
          أدوات تنفيذية لإطلاق حملاتك التسويقية
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
