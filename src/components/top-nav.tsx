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
        <div className="mx-auto max-w-7xl rounded-2xl border border-border bg-popover/95 backdrop-blur-2xl shadow-[0_30px_80px_-30px_rgba(0,0,0,0.6)] p-6 max-h-[74vh] overflow-y-auto animate-fade-up relative">
          <span aria-hidden className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
          <div className="grid grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-5">
            {TOOL_CATEGORIES.map((cat) => (
              <div key={cat}>
                <div className="text-[11px] font-bold uppercase tracking-wider text-primary mb-2 px-2">{cat}</div>
                <div className="space-y-0.5">
                  {TOOLS.filter((t) => t.cat === cat).map((t) => (
                    <Link key={t.href} href={t.href} onClick={() => setMega(false)} className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm text-foreground/85 hover:bg-accent hover:text-accent-foreground transition-colors group">
                      <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-secondary text-base group-hover:scale-110 transition-transform">{t.emoji}</span>
                      <span className="truncate">{t.title}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 pt-4 border-t border-border flex flex-wrap gap-2">
            <Link href="/agency" onClick={() => setMega(false)} className="inline-flex items-center gap-2 rounded-xl bg-secondary border border-border text-foreground text-sm font-semibold px-4 py-2 hover:border-primary/50 transition-colors">
              <ShoppingBag className="size-4 text-primary" /> Oji Agency
            </Link>
            <Link href="/site-builder" onClick={() => setMega(false)} className="inline-flex items-center gap-2 rounded-xl gradient-brand text-white text-sm font-semibold px-4 py-2 hover:brightness-105">
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
            <div className="size-9 rounded-xl gradient-brand grid place-items-center shadow-[0_6px_18px_-8px_color-mix(in_oklab,var(--primary)_80%,transparent)]"><Brain className="size-5 text-white" /></div>
            <span className="text-lg font-extrabold tracking-tight">Oji Brain</span>
          </Link>
          <button onClick={() => setMobile(false)} className="size-10 rounded-xl border border-border bg-secondary grid place-items-center active:scale-95 transition-transform" aria-label="إغلاق"><X className="size-6" /></button>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-5">
          {DIRECT.map((d) => {
            const active = pathname.startsWith(d.href);
            return (
              <Link key={d.href} href={d.href} onClick={() => setMobile(false)} className={cn("rounded-xl border px-3 py-3 text-sm font-semibold text-center active:scale-95 transition-all", active ? "border-primary/60 bg-primary/10 text-primary" : "border-border bg-secondary/50")}>{d.label}</Link>
            );
          })}
        </div>

        {TOOL_CATEGORIES.map((cat) => (
          <div key={cat} className="mb-5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-primary mb-2">{cat}</div>
            <div className="grid grid-cols-2 gap-2">
              {TOOLS.filter((t) => t.cat === cat).map((t) => (
                <Link key={t.href} href={t.href} onClick={() => setMobile(false)} className="flex items-center gap-2 rounded-xl border border-border bg-secondary/40 px-2.5 py-2 text-[13px] active:scale-95 transition-transform">
                  <span className="shrink-0">{t.emoji}</span><span className="truncate">{t.title}</span>
                </Link>
              ))}
            </div>
          </div>
        ))}

        <div className="flex flex-col gap-2 pt-2 border-t border-border pb-8">
          <Link href="/agency" onClick={() => setMobile(false)} className="inline-flex items-center gap-2 rounded-xl bg-secondary border border-border text-foreground text-sm font-semibold px-4 py-3">
            <ShoppingBag className="size-4 text-primary" /> Oji Agency
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
        <div className="size-9 rounded-xl gradient-brand grid place-items-center shadow-[0_6px_18px_-8px_color-mix(in_oklab,var(--primary)_80%,transparent)]">
          <Brain className="size-5 text-white" />
        </div>
        <span className="text-lg font-extrabold tracking-tight hidden sm:inline">Oji Brain</span>
      </Link>

      {/* تنقّل الديسكتوب */}
      <nav className="hidden lg:flex items-center gap-1 mr-2">
        {DIRECT.map((d) => {
          const active = pathname.startsWith(d.href);
          return (
            <Link
              key={d.href}
              href={d.href}
              className={cn(
                "relative px-3 py-2 rounded-xl text-sm font-semibold transition-colors",
                active ? "text-primary" : "text-foreground/75 hover:bg-accent hover:text-foreground"
              )}
            >
              {d.label}
              {active && <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-primary shadow-[0_0_10px_color-mix(in_oklab,var(--primary)_70%,transparent)]" />}
            </Link>
          );
        })}
        <button
          onClick={() => setMega((v) => !v)}
          className={cn(
            "px-3 py-2 rounded-xl text-sm font-semibold inline-flex items-center gap-1.5 transition-colors",
            mega ? "text-primary bg-primary/10" : "text-foreground/75 hover:bg-accent hover:text-foreground"
          )}
        >
          <LayoutGrid className="size-4" /> كل الأدوات
          <ChevronDown className={cn("size-3.5 transition-transform", mega && "rotate-180")} />
        </button>
      </nav>

      {/* هامبرجر الموبايل */}
      <button onClick={() => setMobile(true)} className="lg:hidden size-10 rounded-xl border border-border bg-secondary/60 grid place-items-center active:scale-95 transition-transform" aria-label="القائمة">
        <Menu className="size-5" />
      </button>

      {megaMenu}
      {mobileMenu}
    </>
  );
}
