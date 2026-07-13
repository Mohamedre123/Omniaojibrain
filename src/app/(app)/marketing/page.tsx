import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Megaphone, Hash, Shuffle, Mail, MessageCircle, Calendar as CalendarIcon, Share2, Recycle, GalleryHorizontalEnd, Clapperboard } from "lucide-react";

const TOOLS = [
  { href: "/marketing/repurpose", icon: Recycle, title: "إعادة تدوير المحتوى", description: "فكرة واحدة → بوست + ريلز + ستوري + تغريدة + إيميل + هاشتاجات", color: "from-teal-500 to-emerald-600", badge: "✨ جديد" },
  { href: "/marketing/carousel", icon: GalleryHorizontalEnd, title: "تصميم كاروسيل", description: "موضوع → كاروسيل 5–7 شرائح جاهزة للتصميم", color: "from-fuchsia-500 to-pink-600", badge: "✨ جديد" },
  { href: "/marketing/video-pack", icon: Clapperboard, title: "قوالب فيديو جاهزة", description: "سكربت + برومبتات فيديو + Start/End frame + موسيقى", color: "from-blue-500 to-indigo-600", badge: "✨ جديد" },
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
