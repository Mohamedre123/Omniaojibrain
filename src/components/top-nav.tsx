"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Brain, Menu, X, ChevronDown, LayoutGrid, ShoppingBag, Layout } from "lucide-react";
import { TOOLS, TOOL_CATEGORIES } from "@/lib/tools";
import { cn } from "@/lib/utils";

const DIRECT = [
  { href: "/dashboard", label: "المشاريع" },
  { href: "/assistant", label: "المساعد" },
  { href: "/marketing", label: "التسويق" },
  { href: "/automations", label: "الأتمتة" },
];

export function TopNav() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [mega, setMega] = useState(false);
  const [mobile, setMobile] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => { setMega(false); setMobile(false); }, [pathname]);
  // امنع تمرير الصفحة لما القائمة مفتوحة على الموبايل
  useEffect(() => {
    document.body.style.overflow = mobile ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobile]);

  // ميجا مينو الديسكتوب (Portal — يطلع بره الهيدر عشان يتمركز صح)
  const megaMenu = mega && mounted ? createPortal(
    <>
      <div className="fixed inset-0 z-[60] hidden lg:block" onClick={() => setMega(false)} />
      <div className="fixed left-0 right-0 top-16 z-[61] hidden lg:block px-4">
        <div className="mx-auto max-w-7xl rounded-2xl border border-border/50 bg-card/95 backdrop-blur-2xl shadow-2xl p-6 max-h-[74vh] overflow-y-auto animate-fade-up">
          <div className="grid grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-5">
            {TOOL_CATEGORIES.map((cat) => (
              <div key={cat}>
                <div className="text-xs font-bold text-primary mb-2 px-2">{cat}</div>
                <div className="space-y-0.5">
                  {TOOLS.filter((t) => t.cat === cat).map((t) => (
                    <Link key={t.href} href={t.href} onClick={() => setMega(false)} className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 text-sm hover:bg-muted/70 transition-colors group">
                      <span className="text-base group-hover:scale-110 transition-transform">{t.emoji}</span>
                      <span className="truncate">{t.title}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 pt-4 border-t border-border/50 flex flex-wrap gap-2">
            <Link href="/agency" onClick={() => setMega(false)} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-semibold px-4 py-2 hover:opacity-95">
              <ShoppingBag className="size-4" /> Oji Agency
            </Link>
            <Link href="/site-builder" onClick={() => setMega(false)} className="inline-flex items-center gap-2 rounded-xl gradient-brand text-white text-sm font-semibold px-4 py-2 hover:opacity-95">
              <Layout className="size-4" /> منشئ المواقع
            </Link>
          </div>
        </div>
      </div>
    </>,
    document.body
  ) : null;

  // قائمة الموبايل الكاملة (Portal)
  const mobileMenu = mobile && mounted ? createPortal(
    <div className="fixed inset-0 z-[90] bg-background/98 backdrop-blur-2xl overflow-y-auto lg:hidden">
      <div className="p-4 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
        <div className="flex items-center justify-between mb-4">
          <Link href="/dashboard" className="flex items-center gap-2" onClick={() => setMobile(false)}>
            <div className="size-9 rounded-xl gradient-brand grid place-items-center"><Brain className="size-5 text-white" /></div>
            <span className="text-lg font-extrabold">Oji Brain</span>
          </Link>
          <button onClick={() => setMobile(false)} className="size-10 rounded-xl bg-muted/60 grid place-items-center" aria-label="إغلاق"><X className="size-6" /></button>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-5">
          {DIRECT.map((d) => (
            <Link key={d.href} href={d.href} onClick={() => setMobile(false)} className="rounded-xl border border-border/60 bg-card/60 px-3 py-3 text-sm font-semibold text-center active:scale-95 transition-transform">{d.label}</Link>
          ))}
        </div>

        {TOOL_CATEGORIES.map((cat) => (
          <div key={cat} className="mb-5">
            <div className="text-xs font-bold text-primary mb-2">{cat}</div>
            <div className="grid grid-cols-2 gap-2">
              {TOOLS.filter((t) => t.cat === cat).map((t) => (
                <Link key={t.href} href={t.href} onClick={() => setMobile(false)} className="flex items-center gap-2 rounded-xl border border-border/40 bg-card/40 px-2.5 py-2 text-[13px] active:scale-95 transition-transform">
                  <span className="shrink-0">{t.emoji}</span><span className="truncate">{t.title}</span>
                </Link>
              ))}
            </div>
          </div>
        ))}

        <div className="flex flex-col gap-2 pt-2 border-t border-border/50 pb-8">
          <Link href="/agency" onClick={() => setMobile(false)} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-semibold px-4 py-3">
            <ShoppingBag className="size-4" /> Oji Agency
          </Link>
          <Link href="/site-builder" onClick={() => setMobile(false)} className="inline-flex items-center gap-2 rounded-xl gradient-brand text-white text-sm font-semibold px-4 py-3">
            <Layout className="size-4" /> منشئ المواقع
          </Link>
        </div>
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <>
      {/* اللوجو */}
      <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
        <div className="size-9 rounded-xl gradient-brand grid place-items-center shadow-md shadow-primary/25">
          <Brain className="size-5 text-white" />
        </div>
        <span className="text-lg font-extrabold hidden sm:inline">Oji Brain</span>
      </Link>

      {/* تنقّل الديسكتوب */}
      <nav className="hidden lg:flex items-center gap-1 mr-2">
        {DIRECT.map((d) => (
          <Link
            key={d.href}
            href={d.href}
            className={cn(
              "px-3 py-2 rounded-xl text-sm font-semibold transition-colors",
              pathname.startsWith(d.href) ? "text-primary bg-primary/10" : "text-foreground/80 hover:bg-muted/70 hover:text-foreground"
            )}
          >
            {d.label}
          </Link>
        ))}
        <button
          onClick={() => setMega((v) => !v)}
          className={cn(
            "px-3 py-2 rounded-xl text-sm font-semibold inline-flex items-center gap-1.5 transition-colors",
            mega ? "text-primary bg-primary/10" : "text-foreground/80 hover:bg-muted/70"
          )}
        >
          <LayoutGrid className="size-4" /> كل الأدوات
          <ChevronDown className={cn("size-3.5 transition-transform", mega && "rotate-180")} />
        </button>
      </nav>

      {/* هامبرجر الموبايل */}
      <button onClick={() => setMobile(true)} className="lg:hidden size-10 rounded-xl bg-muted/50 grid place-items-center active:scale-95 transition-transform" aria-label="القائمة">
        <Menu className="size-5" />
      </button>

      {megaMenu}
      {mobileMenu}
    </>
  );
}
