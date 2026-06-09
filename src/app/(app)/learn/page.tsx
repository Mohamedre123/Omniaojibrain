"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  GraduationCap, Lightbulb, BookOpen, Award, Play, Loader2, Sparkles,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const TEMPLATES = [
  { title: "Cinematic Product Shot", category: "Midjourney", prompt: "professional product photography of {product}, cinematic lighting, soft shadows, golden hour, shallow depth of field, 8k, hyperrealistic" },
  { title: "Flat Lay Lifestyle", category: "Midjourney", prompt: "flat lay photography of {product} on minimalist background, natural lighting, props that match brand aesthetic, magazine quality" },
  { title: "Story Background", category: "Midjourney", prompt: "abstract gradient background, soft purple to pink, modern, suitable for instagram story 9:16, minimal" },
  { title: "Reel B-Roll", category: "Veo / Runway", prompt: "cinematic close-up of {subject}, smooth camera dolly in, golden hour lighting, depth of field, 8 seconds" },
  { title: "Product Reveal", category: "Veo", prompt: "smooth slow rotation of {product} on minimal background, premium lighting, brand colors in scene, 5 seconds" },
  { title: "Talking Head Setup", category: "Runway", prompt: "professional talking head shot, clean background, soft key light, brand color accent, medium shot" },
];

const MINI_COURSES = [
  {
    title: "Google Digital Garage",
    badge: "Google",
    level: "مبتدئ → متقدّم",
    description: "كورس مجاني معتمد من Google يغطّي كل أساسيات التسويق الرقمي بشهادة معتمدة عالمياً",
    url: "https://learndigital.withgoogle.com/digitalgarage/courses",
    color: "from-blue-500 to-blue-700",
  },
  {
    title: "Meta Blueprint",
    badge: "Meta",
    level: "كلّ المستويات",
    description: "تعلّم إعلانات Facebook و Instagram من المصدر الرسمي مع شهادات معتمدة من Meta",
    url: "https://www.facebook.com/business/learn",
    color: "from-blue-600 to-indigo-700",
  },
  {
    title: "HubSpot Academy",
    badge: "HubSpot",
    level: "متوسط",
    description: "كورسات مجانية في Inbound Marketing و Content Strategy و Email Marketing",
    url: "https://academy.hubspot.com",
    color: "from-orange-500 to-red-600",
  },
  {
    title: "TikTok Business Learning Center",
    badge: "TikTok",
    level: "مبتدئ",
    description: "تعلّم كيف تنمو على TikTok وتنشئ محتوى viral من TikTok مباشرة",
    url: "https://www.tiktok.com/business/learn",
    color: "from-pink-500 to-rose-600",
  },
  {
    title: "Coursera — Digital Marketing",
    badge: "Coursera",
    level: "متقدّم",
    description: "تخصّصات كاملة من جامعات عالمية في التسويق الرقمي",
    url: "https://www.coursera.org/browse/business/marketing",
    color: "from-blue-700 to-purple-700",
  },
  {
    title: "Maharah — كورسات بالعربية",
    badge: "بالعربية",
    level: "كلّ المستويات",
    description: "منصّة عربية فيها كورسات تسويق رقمي وسوشيال ميديا بأسلوب عربي مبسّط",
    url: "https://maharah.net",
    color: "from-emerald-500 to-teal-600",
  },
];

const CASE_STUDIES = [
  {
    title: "كيف ضاعفت مطعم في الإسكندرية مبيعاتها بـ Reels",
    industry: "F&B",
    summary: "خطّة محتوى ركّزت على لقطات الطبخ الحيّة + UGC من الزبائن، خلال 90 يوماً.",
  },
  {
    title: "براند ملابس محجبات وصل لـ 100K متابع بـ 6 شهور",
    industry: "Fashion",
    summary: "Storytelling حقيقي + تعاون مع micro-influencers + إعلانات Meta مستهدفة بدقّة.",
  },
  {
    title: "عيادة أسنان تتحوّل لـ Authority في تخصّصها",
    industry: "Healthcare",
    summary: "محتوى تعليمي يومي + Before/After (بإذن المرضى) + SEO محلّي.",
  },
];

export default function LearnPage() {
  const [tip, setTip] = useState("");
  const [loadingTip, setLoadingTip] = useState(false);

  async function getTip() {
    setLoadingTip(true);
    setTip("");
    try {
      const res = await fetch("/api/generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool: "tip_of_day", input: "نصيحة اليوم" }),
      });
      if (!res.ok || !res.body) { toast.error("حدثت مشكلة"); return; }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setTip(acc);
      }
    } catch { toast.error("تعذّر الاتصال"); }
    finally { setLoadingTip(false); }
  }

  function copyPrompt(p: string) {
    navigator.clipboard.writeText(p);
    toast.success("تمّ نسخ البرومبت");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <GraduationCap className="size-7 text-primary" />
          التعلّم
        </h1>
        <p className="text-muted-foreground mt-2">
          نصائح، قوالب، ودراسات حالة تطوّر مهاراتك
        </p>
      </div>

      {/* Tip of the Day */}
      <Card className="p-5 mb-6 border-primary/30">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold flex items-center gap-2">
            <Lightbulb className="size-5 text-primary" />
            نصيحة اليوم
          </h2>
          <Button variant="gradient" size="sm" onClick={getTip} disabled={loadingTip}>
            {loadingTip ? <Loader2 className="size-3 animate-spin" /> : <Sparkles className="size-3" />}
            {tip ? "نصيحة جديدة" : "احصل على نصيحة"}
          </Button>
        </div>
        {tip ? (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{tip}</ReactMarkdown>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">اضغط على الزرّ للحصول على نصيحة عملية مخصّصة لك</p>
        )}
      </Card>

      {/* Templates Library */}
      <Card className="p-5 mb-6">
        <h2 className="font-semibold flex items-center gap-2 mb-4">
          <BookOpen className="size-5 text-primary" />
          مكتبة البرومبتات الجاهزة
        </h2>
        <div className="grid gap-3 md:grid-cols-2">
          {TEMPLATES.map((t, i) => (
            <Card key={i} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-sm">{t.title}</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">{t.category}</span>
              </div>
              <pre className="text-xs bg-muted/50 p-2 rounded text-muted-foreground whitespace-pre-wrap line-clamp-3" dir="ltr">{t.prompt}</pre>
              <Button variant="ghost" size="sm" onClick={() => copyPrompt(t.prompt)} className="mt-2 w-full">
                نسخ البرومبت
              </Button>
            </Card>
          ))}
        </div>
      </Card>

      {/* Mini Courses */}
      <Card className="p-5 mb-6">
        <h2 className="font-semibold flex items-center gap-2 mb-4">
          <Play className="size-5 text-primary" />
          منصّات تعليمية مختارة
        </h2>
        <p className="text-xs text-muted-foreground mb-4">منصّات معتمدة عالمياً تقدّم كورسات مجانية في التسويق الرقمي</p>
        <div className="grid gap-3 md:grid-cols-3">
          {MINI_COURSES.map((c, i) => (
            <a
              key={i}
              href={c.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group"
            >
              <Card className="h-full p-5 transition-all hover:shadow-lg hover:-translate-y-0.5 cursor-pointer relative overflow-hidden">
                <div className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r ${c.color}`} />
                <div className="flex items-center justify-between mb-3">
                  <span className={`px-2.5 py-1 rounded-md text-white text-[10px] font-bold bg-gradient-to-r ${c.color}`}>
                    {c.badge}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{c.level}</span>
                </div>
                <h3 className="font-semibold text-base group-hover:text-primary transition-colors mb-2">
                  {c.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{c.description}</p>
                <div className="flex items-center gap-1 mt-3 text-xs text-primary font-medium">
                  <Play className="size-3" /> ابدأ التعلّم
                </div>
              </Card>
            </a>
          ))}
        </div>
      </Card>

      {/* Case Studies */}
      <Card className="p-5 mb-6">
        <h2 className="font-semibold flex items-center gap-2 mb-4">
          <Award className="size-5 text-primary" />
          قصص نجاح من قطاعات مختلفة
        </h2>
        <div className="grid gap-3 md:grid-cols-3">
          {CASE_STUDIES.map((cs, i) => (
            <Card key={i} className="p-4">
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">{cs.industry}</span>
              <h3 className="font-medium mt-2">{cs.title}</h3>
              <p className="text-xs text-muted-foreground mt-2">{cs.summary}</p>
              <Link href={`/dashboard`} className="inline-flex items-center gap-1 text-xs text-primary mt-3 hover:underline">
                <Play className="size-3" /> ابدأ مشروع مماثل
              </Link>
            </Card>
          ))}
        </div>
      </Card>
    </div>
  );
}
