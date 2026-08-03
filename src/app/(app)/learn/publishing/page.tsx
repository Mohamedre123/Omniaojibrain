import Link from "next/link";
import { Card } from "@/components/ui/card";
import { GraduationCap, ArrowLeft } from "lucide-react";

export default function PublishingLearnPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2"><GraduationCap className="size-7 text-primary" /> شرح النشر على المنصّات</h1>
        <Link href="/marketing/publisher" className="text-sm text-muted-foreground hover:text-primary shrink-0 inline-flex items-center gap-1"><ArrowLeft className="size-4" /> صفحة النشر</Link>
      </div>

      <Card className="p-5 space-y-3 mb-4">
        <h2 className="font-semibold">فيه طريقتين للنشر من عندنا:</h2>
        <div className="text-sm text-muted-foreground space-y-2">
          <p>🟢 <b className="text-foreground">النشر السريع (بدون إعداد):</b> بنفتحلك المنصّة بنصّك جاهز (أو ننسخه لإنستجرام/تيك توك) وإنت تضغط نشر. مفيش ربط ولا كلمة سرّ.</p>
          <p>🔵 <b className="text-foreground">النشر التلقائي بالـ API (ربط مرّة واحدة):</b> تجيب توكن من حسابك على المنصّة، تلصقه عندنا، وبعدها تنشر <b>مباشرة</b> بضغطة — الموقع ينشر على نفس الحساب المربوط بالتوكن.</p>
        </div>
      </Card>

      <Card className="p-5 space-y-2 mb-4">
        <h2 className="font-semibold">إيه أدوات زي Buffer / Later / Metricool دي؟</h2>
        <p className="text-sm text-muted-foreground">دي <b>مواقع خارجية مستقلّة</b> للجدولة — إنت بتسجّل فيها لوحدها وبتربط حساباتك عندها. حطّيناها كـ <b>اقتراحات</b> لو حابب تجدول أسبوع كامل. مالهاش علاقة بحسابك عندنا؛ بديل، مش جزء من الموقع. لو عايز النشر يتمّ <b>من عندنا</b> استخدم طريقة الـ API تحت.</p>
      </Card>

      <h2 className="font-bold text-lg mb-2">إزاي تجيب التوكن لكل منصّة</h2>

      <Card className="p-5 space-y-2 mb-3">
        <h3 className="font-semibold">📘 فيسبوك (صفحة)</h3>
        <ol className="text-sm text-muted-foreground list-decimal pr-5 space-y-1">
          <li>افتح <b>developers.facebook.com</b> → اعمل App (نوع Business).</li>
          <li>من <b>Graph API Explorer</b> اختر صفحتك واطلب صلاحيات <code>pages_manage_posts</code> و <code>pages_read_engagement</code>.</li>
          <li>خُد <b>Page Access Token</b> (يُفضّل تحوّله Long-Lived) + <b>Page ID</b> (من إعدادات الصفحة).</li>
          <li>عندنا: اختر «فيسبوك» → الصق التوكن + Page ID → اربط → انشر.</li>
        </ol>
      </Card>

      <Card className="p-5 space-y-2 mb-3">
        <h3 className="font-semibold">📸 انستجرام (Business/Creator)</h3>
        <ol className="text-sm text-muted-foreground list-decimal pr-5 space-y-1">
          <li>لازم حساب <b>Business/Creator</b> مربوط بصفحة فيسبوك.</li>
          <li>من نفس Meta App خُد <b>Access Token</b> بصلاحية <code>instagram_content_publish</code> + <b>Instagram User ID</b>.</li>
          <li>عندنا: اختر «انستجرام» → الصق التوكن + IG User ID → اربط.</li>
          <li>ملاحظة: انستجرام <b>لازم صورة</b> (منشور نصّي بس مش مسموح) — فارفع صورك.</li>
        </ol>
      </Card>

      <Card className="p-5 space-y-2 mb-3">
        <h3 className="font-semibold">✈️ تليجرام (قناة)</h3>
        <ol className="text-sm text-muted-foreground list-decimal pr-5 space-y-1">
          <li>افتح <b>@BotFather</b> → <code>/newbot</code> → خُد <b>Bot Token</b>.</li>
          <li>ضيف البوت <b>Admin</b> في قناتك.</li>
          <li>عندنا: اختر «تليجرام» → الصق التوكن + معرّف القناة (مثل <code>@mychannel</code>) → اربط → انشر.</li>
        </ol>
      </Card>

      <Card className="p-5 space-y-2 mb-3">
        <h3 className="font-semibold">💼 لينكدإن</h3>
        <ol className="text-sm text-muted-foreground list-decimal pr-5 space-y-1">
          <li>من <b>LinkedIn Developers</b> اعمل App واطلب صلاحية <code>w_member_social</code>.</li>
          <li>خُد <b>Access Token</b> + <b>Author URN</b> (مثل <code>urn:li:person:XXXX</code> أو <code>urn:li:organization:XXXX</code>).</li>
          <li>عندنا: اختر «لينكدإن» → الصق التوكن + Author URN → اربط. (النشر النصّي مدعوم؛ الصور تحتاج خطوات إضافية.)</li>
        </ol>
      </Card>

      <Card className="p-5 space-y-2">
        <h3 className="font-semibold">🐦 X (تويتر) و 🎵 تيك توك</h3>
        <p className="text-sm text-muted-foreground">المنصّتين دول بيطلبوا <b>OAuth ومراجعة تطبيق</b> للنشر التلقائي (مش مجرّد توكن). فحالياً بنستخدم زرّ <b>«نسخ + فتح»</b>: بننسخلك النصّ ونفتح المنصّة، وإنت تلصق وتنشر. أول ما تجهّز إعداد OAuth نقدر نفعّل النشر المباشر ليهم.</p>
      </Card>
    </div>
  );
}
