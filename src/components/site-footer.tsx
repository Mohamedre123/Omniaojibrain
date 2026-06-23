import Link from "next/link";
import { Brain, Phone, RotateCcw, Layout, Tag, FileText, Shield, RefreshCw } from "lucide-react";

/** فوتر موحّد يظهر في كل الصفحات (قبل وبعد تسجيل الدخول) */
export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 py-8 safe-bottom mt-auto">
      <div className="container mx-auto px-4 space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 text-center">
          <span className="text-sm text-muted-foreground">عندك سؤال أو محتاج مساعدة؟</span>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 rounded-full gradient-brand text-white text-sm font-semibold px-5 py-2.5 hover:opacity-90 transition-opacity"
          >
            <Phone className="size-4" /> تواصل معنا
          </Link>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
          <Link href="/contact" className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors">
            <Phone className="size-3.5" /> تواصل معنا
          </Link>
          <Link href="/pricing" className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors">
            <Tag className="size-3.5" /> الباقات
          </Link>
          <Link href="/site-builder" className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors">
            <Layout className="size-3.5" /> منشئ المواقع
          </Link>
          <Link href="/terms" className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors">
            <FileText className="size-3.5" /> الشروط والأحكام
          </Link>
          <Link href="/privacy" className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors">
            <Shield className="size-3.5" /> سياسة الخصوصية
          </Link>
          <Link href="/refund" className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors">
            <RotateCcw className="size-3.5" /> سياسة الاسترداد
          </Link>
          <Link href="/subscription" className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors">
            <RefreshCw className="size-3.5" /> الاشتراك والإلغاء
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground border-t border-border/60 pt-5">
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-md gradient-brand grid place-items-center"><Brain className="size-3.5 text-white" /></div>
            <span className="font-semibold text-foreground">Oji Brain</span>
          </div>
          <p>© {new Date().getFullYear()} Oji Brain — جزءٌ من Oji</p>
        </div>
      </div>
    </footer>
  );
}
