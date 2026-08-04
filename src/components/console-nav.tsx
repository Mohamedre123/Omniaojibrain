"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { TOOLS, TOOL_CATEGORIES } from "@/lib/tools";
import {
  LayoutGrid, MessageSquare, Image as ImageIcon, Megaphone, TrendingUp,
  Workflow, Briefcase, LayoutTemplate, Target, Calendar, Settings, Grid3x3,
  Brain, Menu, X, Search, ShoppingBag, Layout, Sparkles, CheckSquare, Star, BookOpen,
} from "lucide-react";

type Item = { href: string; label: string; icon: typeof LayoutGrid };

// وجهات الريل الأساسية (أيقونات فقط)
const RAIL: Item[] = [
  { href: "/dashboard", label: "المشاريع", icon: LayoutGrid },
  { href: "/assistant", label: "المساعد", icon: MessageSquare },
  { href: "/studio", label: "الاستوديو", icon: ImageIcon },
  { href: "/marketing", label: "التسويق", icon: Megaphone },
  { href: "/insights", label: "الرؤى", icon: TrendingUp },
  { href: "/automations", label: "الأتمتة", icon: Workflow },
  { href: "/leads", label: "جذب العملاء", icon: Target },
  { href: "/business", label: "أدوات الأعمال", icon: Briefcase },
  { href: "/templates", label: "القوالب", icon: LayoutTemplate },
  { href: "/calendar", label: "التقويم", icon: Calendar },
];

// قائمة الموبايل الكاملة (كل الأقسام)
const FULL: Item[] = [
  ...RAIL,
  { href: "/brand", label: "هوية العلامة", icon: Sparkles },
  { href: "/tasks", label: "مهامي", icon: CheckSquare },
  { href: "/knowledge", label: "قاعدة المعرفة", icon: BookOpen },
  { href: "/favorites", label: "المفضّلة", icon: Star },
  { href: "/settings", label: "الإعدادات", icon: Settings },
];

function useActive() {
  const pathname = usePathname();
  return (href: string) => pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
}

/** ريل أيقونات عمودي رفيع على يمين الشاشة (ديسكتوب فقط) */
export function IconRail() {
  const isActive = useActive();
  return (
    <aside className="hidden lg:flex fixed top-0 right-0 bottom-0 z-40 w-16 flex-col items-center border-l border-border bg-card/60 backdrop-blur-2xl safe-top">
      <Link href="/dashboard" className="mt-3 mb-2 grid size-10 place-items-center rounded-md gradient-brand shadow-[0_6px_18px_-8px_color-mix(in_oklab,var(--primary)_80%,transparent)]" title="Oji Brain">
        <Brain className="size-5 text-white" />
      </Link>

      <div className="w-8 border-t border-border/70 my-1" />

      <nav className="flex-1 flex flex-col items-center gap-1 overflow-y-auto py-2 no-scrollbar">
        {RAIL.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className="group relative grid size-11 place-items-center">
              {active && <span aria-hidden className="absolute right-0 top-1/2 -translate-y-1/2 h-6 w-0.5 rounded-full bg-primary shadow-[0_0_10px_color-mix(in_oklab,var(--primary)_80%,transparent)]" />}
              <span className={cn("grid size-10 place-items-center rounded-md border transition-all",
                active ? "border-primary/50 bg-primary/12 text-primary" : "border-transparent text-muted-foreground group-hover:border-border group-hover:bg-accent group-hover:text-foreground")}>
                <Icon className="size-[18px]" />
              </span>
              {/* ليبل يطلع لليسار عند التمرير */}
              <span className="pointer-events-none absolute right-full mr-2 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-md border border-border bg-popover px-2 py-1 text-xs font-medium opacity-0 translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0 shadow-lg z-50">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="w-8 border-t border-border/70 my-1" />
      <div className="flex flex-col items-center gap-1 pb-3">
        <button onClick={() => window.dispatchEvent(new Event("oji-open-palette"))} className="group relative grid size-11 place-items-center" title="كل الأدوات">
          <span className="grid size-10 place-items-center rounded-md border border-transparent text-muted-foreground hover:border-border hover:bg-accent hover:text-foreground transition-all">
            <Grid3x3 className="size-[18px]" />
          </span>
          <span className="pointer-events-none absolute right-full mr-2 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-md border border-border bg-popover px-2 py-1 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-50">كل الأدوات</span>
        </button>
        <Link href="/settings" className="group relative grid size-11 place-items-center" title="الإعدادات">
          <span className={cn("grid size-10 place-items-center rounded-md border transition-all", isActive("/settings") ? "border-primary/50 bg-primary/12 text-primary" : "border-transparent text-muted-foreground hover:border-border hover:bg-accent hover:text-foreground")}>
            <Settings className="size-[18px]" />
          </span>
          <span className="pointer-events-none absolute right-full mr-2 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-md border border-border bg-popover px-2 py-1 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-50">الإعدادات</span>
        </Link>
      </div>
    </aside>
  );
}

/** الموبايل: زر قائمة + Drawer كامل + شريط سفلي */
export function ConsoleMobileNav() {
  const pathname = usePathname();
  const isActive = useActive();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => { document.body.style.overflow = open ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [open]);

  const bottom: Item[] = RAIL.slice(0, 4);

  const drawer = open && mounted ? createPortal(
    <div className="fixed inset-0 z-[95] lg:hidden">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setOpen(false)} />
      <div className="absolute inset-y-0 right-0 w-[86vw] max-w-sm bg-background border-l border-border overflow-y-auto animate-fade-up p-4 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
        <div className="flex items-center justify-between mb-4">
          <Link href="/dashboard" className="flex items-center gap-2" onClick={() => setOpen(false)}>
            <div className="size-9 rounded-md gradient-brand grid place-items-center"><Brain className="size-5 text-white" /></div>
            <span className="text-lg font-extrabold tracking-tight">Oji Brain</span>
          </Link>
          <button onClick={() => setOpen(false)} className="size-10 rounded-md border border-border bg-secondary grid place-items-center" aria-label="إغلاق"><X className="size-5" /></button>
        </div>

        <div className="label-mono px-1 mb-2">MENU</div>
        <div className="grid grid-cols-2 gap-2 mb-5">
          {FULL.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
                className={cn("flex items-center gap-2.5 rounded-md border px-3 py-2.5 text-sm font-medium active:scale-95 transition-all",
                  active ? "border-primary/50 bg-primary/10 text-primary" : "border-border bg-secondary/40 text-foreground/80")}>
                <Icon className="size-[18px] shrink-0" /><span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>

        <div className="label-mono px-1 mb-2">TOOLS</div>
        <div className="space-y-3 mb-5">
          {TOOL_CATEGORIES.map((cat) => (
            <div key={cat}>
              <div className="text-[11px] font-bold text-primary mb-1.5">{cat}</div>
              <div className="grid grid-cols-2 gap-1.5">
                {TOOLS.filter((t) => t.cat === cat).map((t) => (
                  <Link key={t.href} href={t.href} onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-md border border-border bg-secondary/30 px-2.5 py-2 text-[13px] active:scale-95 transition-transform">
                    <span className="shrink-0">{t.emoji}</span><span className="truncate">{t.title}</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2 pb-8 border-t border-border pt-3">
          <Link href="/agency" onClick={() => setOpen(false)} className="inline-flex items-center gap-2 rounded-md border border-border bg-secondary px-4 py-3 text-sm font-semibold"><ShoppingBag className="size-4 text-primary" /> Oji Agency</Link>
          <Link href="/site-builder" onClick={() => setOpen(false)} className="inline-flex items-center gap-2 rounded-md gradient-brand text-white px-4 py-3 text-sm font-semibold"><Layout className="size-4" /> منشئ المواقع</Link>
        </div>
      </div>
    </div>,
    document.body
  ) : null;

  const bottomBar = mounted ? createPortal(
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/90 backdrop-blur-2xl safe-bottom">
      <div className="grid grid-cols-5">
        {bottom.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className="flex flex-col items-center gap-1 py-2 active:scale-95 transition-transform">
              <Icon className={cn("size-5", active ? "text-primary" : "text-muted-foreground")} />
              <span className={cn("text-[10px] font-medium", active ? "text-primary" : "text-muted-foreground")}>{item.label}</span>
            </Link>
          );
        })}
        <button onClick={() => setOpen(true)} className="flex flex-col items-center gap-1 py-2 active:scale-95 transition-transform">
          <Menu className="size-5 text-muted-foreground" />
          <span className="text-[10px] font-medium text-muted-foreground">المزيد</span>
        </button>
      </div>
    </nav>,
    document.body
  ) : null;

  return (
    <>
      <button onClick={() => setOpen(true)} className="lg:hidden size-10 rounded-md border border-border bg-secondary/60 grid place-items-center active:scale-95 transition-transform" aria-label="القائمة">
        <Menu className="size-5" />
      </button>
      {drawer}
      {bottomBar}
    </>
  );
}

/** زر بحث في التوب-بار يفتح لوحة الأوامر */
export function RailSearchButton() {
  return (
    <button
      onClick={() => window.dispatchEvent(new Event("oji-open-palette"))}
      className="inline-flex items-center gap-2 h-9 rounded-md border border-border bg-secondary/50 px-3 text-sm text-muted-foreground hover:border-primary/50 transition-colors"
    >
      <Search className="size-4 shrink-0" />
      <span className="hidden sm:inline">دوّر على أداة…</span>
      <kbd className="hidden sm:inline text-[10px] border border-border rounded px-1 py-0.5 font-mono">Ctrl K</kbd>
    </button>
  );
}
