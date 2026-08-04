"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import {
  LayoutGrid, MessageSquare, Image as ImageIcon, Calendar, CheckSquare,
  Megaphone, TrendingUp, Target, Sparkles, LayoutTemplate, Wand2,
  Workflow, Briefcase, BookOpen, LinkIcon, Users, Star, GraduationCap,
  Settings, Brain, Search, ShoppingBag, Layout, ChevronRight, ChevronLeft, X, Grid3x3,
} from "lucide-react";

type Item = { href: string; label: string; icon: typeof LayoutGrid };

const SECTIONS: { title: string; items: Item[] }[] = [
  { title: "المساحة", items: [
    { href: "/dashboard", label: "المشاريع", icon: LayoutGrid },
    { href: "/assistant", label: "المساعد العام", icon: MessageSquare },
    { href: "/studio", label: "الاستوديو", icon: ImageIcon },
    { href: "/calendar", label: "التقويم", icon: Calendar },
    { href: "/tasks", label: "مهامي", icon: CheckSquare },
  ]},
  { title: "الإبداع والتسويق", items: [
    { href: "/marketing", label: "التسويق", icon: Megaphone },
    { href: "/insights", label: "الرؤى والتحليلات", icon: TrendingUp },
    { href: "/leads", label: "جذب العملاء", icon: Target },
    { href: "/brand", label: "هوية العلامة", icon: Sparkles },
    { href: "/templates", label: "مكتبة القوالب", icon: LayoutTemplate },
    { href: "/prompts", label: "برومبتات احترافية", icon: Wand2 },
  ]},
  { title: "الأدوات والمزيد", items: [
    { href: "/automations", label: "الأتمتة والوكلاء", icon: Workflow },
    { href: "/business", label: "أدوات الأعمال", icon: Briefcase },
    { href: "/knowledge", label: "قاعدة المعرفة", icon: BookOpen },
    { href: "/bio", label: "صفحة الروابط", icon: LinkIcon },
    { href: "/team", label: "الفريق", icon: Users },
    { href: "/favorites", label: "المفضّلة", icon: Star },
    { href: "/learn", label: "التعلّم", icon: GraduationCap },
  ]},
];

function useActive() {
  const pathname = usePathname();
  return (href: string) => pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
}

/** زر فتح السايدبار على الموبايل (يوضع في الهيدر) */
export function SidebarTrigger() {
  return (
    <button
      onClick={() => window.dispatchEvent(new Event("oji:toggle-sidebar"))}
      className="lg:hidden size-10 rounded-xl border border-border bg-secondary/60 grid place-items-center active:scale-95 transition-transform"
      aria-label="القائمة"
    >
      <Grid3x3 className="size-5" />
    </button>
  );
}

/** زر بحث في التوب-بار يفتح لوحة الأوامر */
export function TopSearch() {
  return (
    <button
      onClick={() => window.dispatchEvent(new Event("oji-open-palette"))}
      className="inline-flex items-center gap-2 h-10 rounded-xl border border-border bg-secondary/50 px-3.5 text-sm text-muted-foreground hover:border-primary/50 transition-colors"
    >
      <Search className="size-4 shrink-0" />
      <span className="hidden sm:inline">دوّر على أداة أو مشروع…</span>
      <kbd className="hidden md:inline text-[10px] border border-border rounded px-1 py-0.5 font-mono">Ctrl K</kbd>
    </button>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const isActive = useActive();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setCollapsed(localStorage.getItem("oji-sidebar-collapsed") === "1");
    const open = () => setMobileOpen(true);
    window.addEventListener("oji:toggle-sidebar", open);
    return () => window.removeEventListener("oji:toggle-sidebar", open);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [pathname]);
  useEffect(() => { document.body.style.overflow = mobileOpen ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [mobileOpen]);

  function toggleCollapse() {
    setCollapsed((c) => { const n = !c; localStorage.setItem("oji-sidebar-collapsed", n ? "1" : "0"); return n; });
  }

  function Nav({ expanded, onNavigate }: { expanded: boolean; onNavigate?: () => void }) {
    return (
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2.5 py-3 space-y-4 no-scrollbar">
        {SECTIONS.map((sec) => (
          <div key={sec.title}>
            {expanded && <div className="label-mono px-2.5 mb-1.5">{sec.title}</div>}
            <div className="space-y-0.5">
              {sec.items.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    title={!expanded ? item.label : undefined}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-xl py-2.5 text-sm font-medium transition-all",
                      expanded ? "px-3" : "px-0 justify-center",
                      active ? "bg-primary/12 text-primary" : "text-foreground/70 hover:bg-accent hover:text-foreground"
                    )}
                  >
                    {active && <span aria-hidden className="absolute right-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-s-full bg-primary shadow-[0_0_12px_color-mix(in_oklab,var(--primary)_75%,transparent)]" />}
                    <Icon className={cn("size-[19px] shrink-0 transition-transform group-hover:scale-110", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                    {expanded && <span className="truncate">{item.label}</span>}
                    {!expanded && (
                      <span className="pointer-events-none absolute right-full mr-2 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-lg border border-border bg-popover px-2.5 py-1.5 text-xs font-medium opacity-0 translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0 shadow-lg z-50">{item.label}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    );
  }

  function Footer({ expanded, onNavigate }: { expanded: boolean; onNavigate?: () => void }) {
    return (
      <div className="p-2.5 border-t border-border space-y-1.5">
        <Link href="/agency" onClick={onNavigate} title={!expanded ? "Oji Agency" : undefined}
          className={cn("flex items-center gap-3 rounded-xl py-2.5 text-sm font-semibold bg-secondary border border-border hover:border-primary/50 transition-colors", expanded ? "px-3" : "px-0 justify-center")}>
          <ShoppingBag className="size-[18px] text-gold shrink-0" />{expanded && <span className="flex-1">Oji Agency</span>}
        </Link>
        <Link href="/site-builder" onClick={onNavigate} title={!expanded ? "منشئ المواقع" : undefined}
          className={cn("flex items-center gap-3 rounded-xl py-2.5 text-sm font-semibold text-white gradient-brand hover:brightness-105 transition-all", expanded ? "px-3" : "px-0 justify-center")}>
          <Layout className="size-[18px] shrink-0" />{expanded && <span className="flex-1">منشئ المواقع</span>}
        </Link>
        <Link href="/settings" onClick={onNavigate} title={!expanded ? "الإعدادات" : undefined}
          className={cn("flex items-center gap-3 rounded-xl py-2 text-sm font-medium transition-colors", expanded ? "px-3" : "px-0 justify-center", isActive("/settings") ? "bg-primary/10 text-primary" : "text-foreground/70 hover:bg-accent hover:text-foreground")}>
          <Settings className="size-[18px] shrink-0" />{expanded && <span>الإعدادات</span>}
        </Link>
      </div>
    );
  }

  // ===== Desktop (collapsible, sticky column) =====
  const desktop = (
    <aside className={cn(
      "hidden lg:flex sticky top-0 h-screen shrink-0 flex-col border-s border-border bg-card/40 backdrop-blur-2xl transition-[width] duration-300 safe-top",
      collapsed ? "w-[74px]" : "w-[260px]"
    )}>
      <div className={cn("flex items-center gap-2.5 p-4 border-b border-border", collapsed && "justify-center px-0")}>
        <Link href="/dashboard" className="flex items-center gap-2.5 min-w-0">
          <div className="size-10 rounded-xl gradient-brand grid place-items-center shadow-[0_8px_20px_-8px_color-mix(in_oklab,var(--primary)_85%,transparent)] shrink-0">
            <Brain className="size-5 text-white" />
          </div>
          {!collapsed && <span className="text-lg font-extrabold tracking-tight truncate">Oji Brain</span>}
        </Link>
        {!collapsed && (
          <button onClick={toggleCollapse} className="ms-auto size-8 rounded-lg border border-border bg-secondary/60 grid place-items-center text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors" aria-label="طيّ القائمة" title="طيّ القائمة">
            <ChevronRight className="size-4" />
          </button>
        )}
      </div>

      {collapsed && (
        <button onClick={toggleCollapse} className="mx-auto mt-2 size-9 rounded-lg border border-border bg-secondary/60 grid place-items-center text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors" aria-label="فتح القائمة" title="فتح القائمة">
          <ChevronLeft className="size-4" />
        </button>
      )}

      <Nav expanded={!collapsed} />
      <Footer expanded={!collapsed} />
    </aside>
  );

  // ===== Mobile (drawer) =====
  const drawer = mobileOpen && mounted ? createPortal(
    <div className="fixed inset-0 z-[95] lg:hidden">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setMobileOpen(false)} />
      <aside className="absolute inset-y-0 right-0 w-[80vw] max-w-[300px] bg-card border-s border-border flex flex-col animate-fade-up">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <Link href="/dashboard" className="flex items-center gap-2.5" onClick={() => setMobileOpen(false)}>
            <div className="size-10 rounded-xl gradient-brand grid place-items-center"><Brain className="size-5 text-white" /></div>
            <span className="text-lg font-extrabold tracking-tight">Oji Brain</span>
          </Link>
          <button onClick={() => setMobileOpen(false)} className="size-9 rounded-lg border border-border bg-secondary grid place-items-center" aria-label="إغلاق"><X className="size-5" /></button>
        </div>
        <Nav expanded onNavigate={() => setMobileOpen(false)} />
        <Footer expanded onNavigate={() => setMobileOpen(false)} />
      </aside>
    </div>,
    document.body
  ) : null;

  return (<>{desktop}{drawer}</>);
}
