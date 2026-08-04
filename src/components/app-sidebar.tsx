"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Image as ImageIcon,
  Calendar,
  Megaphone,
  TrendingUp,
  Target,
  Sparkles,
  Briefcase,
  GraduationCap,
  Users,
  LayoutTemplate,
  BookOpen,
  CheckSquare,
  Star,
  Settings,
  X,
  Brain,
  MessageSquare,
  Phone,
  Layout,
  ArrowUpRight,
  Tag,
  Gift,
  Rocket,
  ShoppingBag,
  Search,
  Workflow,
} from "lucide-react";

type Item = { href: string; label: string; icon: typeof LayoutDashboard };

const SECTIONS: { title: string; items: Item[] }[] = [
  {
    title: "المساحة",
    items: [
      { href: "/dashboard", label: "المشاريع", icon: LayoutDashboard },
      { href: "/assistant", label: "المساعد العام", icon: MessageSquare },
      { href: "/studio", label: "الاستوديو", icon: ImageIcon },
      { href: "/calendar", label: "التقويم", icon: Calendar },
      { href: "/tasks", label: "مهامي", icon: CheckSquare },
    ],
  },
  {
    title: "الإبداع والتسويق",
    items: [
      { href: "/marketing", label: "التسويق", icon: Megaphone },
      { href: "/insights", label: "الرؤى والتحليلات", icon: TrendingUp },
      { href: "/leads", label: "جذب العملاء", icon: Target },
      { href: "/brand", label: "هوية العلامة", icon: Sparkles },
      { href: "/templates", label: "مكتبة القوالب", icon: LayoutTemplate },
      { href: "/prompts", label: "برومبتات احترافية", icon: Sparkles },
    ],
  },
  {
    title: "الأدوات والمزيد",
    items: [
      { href: "/automations", label: "الأتمتة والوكلاء", icon: Workflow },
      { href: "/business", label: "أدوات الأعمال", icon: Briefcase },
      { href: "/knowledge", label: "قاعدة المعرفة", icon: BookOpen },
      { href: "/bio", label: "صفحة الروابط", icon: LayoutTemplate },
      { href: "/team", label: "الفريق", icon: Users },
      { href: "/favorites", label: "المفضّلة", icon: Star },
      { href: "/learn", label: "التعلّم", icon: GraduationCap },
    ],
  },
];

const FOOTER_NAV: Item[] = [
  { href: "/start", label: "ابدأ مع Oji", icon: Rocket },
  { href: "/referral", label: "ادعُ صديقاً 🎁", icon: Gift },
  { href: "/pricing", label: "الباقات", icon: Tag },
  { href: "/contact", label: "تواصل معنا", icon: Phone },
  { href: "/settings", label: "الإعدادات", icon: Settings },
];

/** زر فتح القائمة على الموبايل — يوضع داخل الهيدر عشان ما يتغطّاش */
export function SidebarTrigger({ className }: { className?: string }) {
  return (
    <button
      onClick={() => window.dispatchEvent(new Event("oji:toggle-sidebar"))}
      className={cn(
        "lg:hidden size-10 rounded-xl border border-border bg-secondary/60 grid place-items-center active:scale-95 transition-transform",
        className
      )}
      aria-label="القائمة"
    >
      <Search className="size-5" />
    </button>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) =>
    pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

  useEffect(() => {
    const open = () => setMobileOpen(true);
    window.addEventListener("oji:toggle-sidebar", open);
    return () => window.removeEventListener("oji:toggle-sidebar", open);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMobileOpen(false); };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [mobileOpen]);

  function NavLink({ item }: { item: Item }) {
    const active = isActive(item.href);
    const Icon = item.icon;
    return (
      <Link
        href={item.href}
        onClick={() => setMobileOpen(false)}
        className={cn(
          "group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
          active
            ? "bg-primary/12 text-primary"
            : "text-foreground/70 hover:bg-accent hover:text-foreground"
        )}
      >
        {active && <span aria-hidden className="absolute right-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-full bg-primary shadow-[0_0_12px_color-mix(in_oklab,var(--primary)_75%,transparent)]" />}
        <Icon className={cn("size-[18px] shrink-0 transition-transform group-hover:scale-110", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
        <span className="truncate">{item.label}</span>
      </Link>
    );
  }

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fade-in"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:sticky top-0 right-0 h-screen lg:h-screen w-[min(82vw,17rem)] lg:w-[17rem] shrink-0 border-l border-border bg-card/60 lg:bg-card/30 backdrop-blur-2xl z-50 flex flex-col transition-transform duration-300 safe-top",
          mobileOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="p-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl gradient-brand grid place-items-center shadow-[0_6px_18px_-8px_color-mix(in_oklab,var(--primary)_80%,transparent)]">
              <Brain className="size-5 text-white" />
            </div>
            <span className="text-lg font-extrabold tracking-tight">Oji Brain</span>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden size-8 rounded-lg hover:bg-accent grid place-items-center"
            aria-label="إغلاق"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* بحث سريع عن الأدوات */}
        <div className="px-3 pb-2">
          <button
            onClick={() => { setMobileOpen(false); window.dispatchEvent(new Event("oji-open-palette")); }}
            className="w-full inline-flex items-center gap-2 h-10 rounded-xl border border-border bg-secondary/50 px-3 text-sm text-muted-foreground hover:border-primary/50 transition-colors"
          >
            <Search className="size-4 shrink-0" />
            <span className="flex-1 text-right">دوّر على أداة…</span>
            <kbd className="text-[10px] border border-border rounded px-1 py-0.5">Ctrl K</kbd>
          </button>
        </div>

        {/* Nav sections */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
          {SECTIONS.map((sec) => (
            <div key={sec.title}>
              <div className="px-3 mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">{sec.title}</div>
              <div className="space-y-0.5">
                {sec.items.map((item) => <NavLink key={item.href} item={item} />)}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-border space-y-1">
          <Link
            href="/agency"
            onClick={() => setMobileOpen(false)}
            className="group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold bg-secondary border border-border overflow-hidden mb-1 hover:border-primary/50 transition-colors"
          >
            <ShoppingBag className="size-[18px] text-primary" />
            <span className="flex-1">Oji Agency — تسويق</span>
            <ArrowUpRight className="size-4 opacity-70 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
          <Link
            href="/site-builder"
            onClick={() => setMobileOpen(false)}
            className="group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-white gradient-brand overflow-hidden mb-1 hover:brightness-105 transition-all"
          >
            <Layout className="size-[18px] relative" />
            <span className="relative flex-1">منشئ المواقع</span>
            <ArrowUpRight className="size-4 relative opacity-80 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
          <div className="grid grid-cols-2 gap-1 pt-1">
            {FOOTER_NAV.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-2 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-colors",
                    active ? "bg-primary/10 text-primary" : "text-foreground/70 hover:bg-accent hover:text-foreground"
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </aside>
    </>
  );
}

/** شريط تنقّل سفلي على الموبايل — يغيّر بنية التنقّل تماماً */
export function MobileBottomNav() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
  const items: Item[] = [
    { href: "/dashboard", label: "المشاريع", icon: LayoutDashboard },
    { href: "/assistant", label: "المساعد", icon: MessageSquare },
    { href: "/studio", label: "الاستوديو", icon: ImageIcon },
    { href: "/marketing", label: "التسويق", icon: Megaphone },
  ];
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/90 backdrop-blur-2xl safe-bottom">
      <div className="grid grid-cols-4">
        {items.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className="flex flex-col items-center gap-1 py-2.5 active:scale-95 transition-transform">
              <Icon className={cn("size-5", active ? "text-primary" : "text-muted-foreground")} />
              <span className={cn("text-[10px] font-medium", active ? "text-primary" : "text-muted-foreground")}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
