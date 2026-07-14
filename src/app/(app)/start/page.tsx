"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Rocket, Check, ArrowLeft } from "lucide-react";

const STEPS = [
  { id: "brand", title: "اضبط هوية علامتك", desc: "اسم، نبرة، ألوان، ولوجو من الإعدادات", href: "/settings" },
  { id: "project", title: "اعمل أول مشروع", desc: "أو استخدم Magic Brief من رابط", href: "/dashboard" },
  { id: "image", title: "ولّد أول صورة", desc: "من الاستوديو", href: "/studio" },
  { id: "assistant", title: "جرّب المساعد العام", desc: "اسأله عن استراتيجية أو أفكار", href: "/assistant" },
  { id: "knowledge", title: "أضف معرفة مشروعك", desc: "منتجات وأسعار وأسئلة شائعة", href: "/knowledge" },
  { id: "templates", title: "تصفّح مكتبة القوالب", desc: "قوالب جاهزة ومرجع تصوير", href: "/templates" },
];
const KEY = "oji_onboarding";

export default function StartPage() {
  const [done, setDone] = useState<Record<string, boolean>>({});

  useEffect(() => { try { setDone(JSON.parse(localStorage.getItem(KEY) || "{}")); } catch {} }, []);
  function toggle(id: string) {
    const next = { ...done, [id]: !done[id] };
    setDone(next); localStorage.setItem(KEY, JSON.stringify(next));
  }
  const completed = STEPS.filter((s) => done[s.id]).length;

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-6 text-center">
        <div className="mx-auto size-16 rounded-2xl gradient-brand grid place-items-center mb-4 animate-float-slow"><Rocket className="size-8 text-white" /></div>
        <h1 className="text-2xl sm:text-3xl font-bold">ابدأ مع Oji</h1>
        <p className="text-muted-foreground mt-2 text-sm">6 خطوات سريعة تخلّيك تستفيد من الموقع بالكامل.</p>
        <div className="mt-4 h-2 rounded-full bg-muted overflow-hidden max-w-xs mx-auto">
          <div className="h-full gradient-brand transition-all" style={{ width: `${(completed / STEPS.length) * 100}%` }} />
        </div>
        <p className="text-xs text-muted-foreground mt-2">{completed} / {STEPS.length}</p>
      </div>

      <div className="space-y-3">
        {STEPS.map((s) => (
          <Card key={s.id} className="p-4 flex items-center gap-3">
            <button onClick={() => toggle(s.id)} className={`size-7 rounded-full border grid place-items-center shrink-0 ${done[s.id] ? "bg-primary border-primary text-white" : ""}`}>
              {done[s.id] && <Check className="size-4" />}
            </button>
            <div className="flex-1 min-w-0">
              <h3 className={`font-semibold text-sm ${done[s.id] ? "line-through text-muted-foreground" : ""}`}>{s.title}</h3>
              <p className="text-xs text-muted-foreground">{s.desc}</p>
            </div>
            <Link href={s.href} className="text-primary shrink-0 text-sm inline-flex items-center gap-1">افتح <ArrowLeft className="size-3.5" /></Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
