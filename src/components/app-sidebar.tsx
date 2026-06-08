"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
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
  Settings,
  Menu,
  X,
  Brain,
} from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "المشاريع", icon: LayoutDashboard, color: "text-blue-500" },
  { href: "/studio", label: "الاستوديو", icon: ImageIcon, color: "text-rose-500" },
  { href: "/calendar", label: "التقويم", icon: Calendar, color: "text-emerald-500" },
  { href: "/marketing", label: "التسويق", icon: Megaphone, color: "text-orange-500" },
  { href: "/insights", label: "الرؤى والتحليلات", icon: TrendingUp, color: "text-cyan-500" },
  { href: "/leads", label: "جذب العملاء", icon: Target, color: "text-amber-500" },
  { href: "/brand", label: "هوية العلامة", icon: Sparkles, color: "text-purple-500" },
  { href: "/business", label: "أدوات الأعمال", icon: Briefcase, color: "text-indigo-500" },
  { href: "/team", label: "الفريق", icon: Users, color: "text-teal-500" },
  { href: "/learn", label: "التعلّم", icon: GraduationCap, color: "text-pink-500" },
];

const FOOTER_NAV = [
  { href: "/settings", label: "الإعدادات", icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) =>
    pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

  return (
    <>
      {/* Mobile trigger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-3 right-3 z-30 size-10 rounded-lg border bg-card grid place-items-center"
        aria-label="القائمة"
      >
        <Menu className="size-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:sticky top-0 right-0 h-screen w-64 border-l bg-card z-50 flex flex-col transition-transform",
          mobileOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="p-4 border-b flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="size-9 rounded-lg gradient-brand grid place-items-center">
              <Brain className="size-5 text-white" />
            </div>
            <span className="text-lg font-bold">Oji Brain</span>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden size-8 rounded-md hover:bg-muted grid place-items-center"
            aria-label="إغلاق"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {NAV.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-foreground hover:bg-muted"
                )}
              >
                <Icon className={cn("size-5", active ? "text-primary" : item.color)} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t space-y-1">
          {FOOTER_NAV.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium",
                  active ? "bg-primary/10 text-primary" : "hover:bg-muted"
                )}
              >
                <Icon className="size-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </aside>
    </>
  );
}
