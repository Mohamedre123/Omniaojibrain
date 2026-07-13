"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LayoutTemplate, Copy, Check } from "lucide-react";

type Template = { cat: string; title: string; prompt: string };

const CATEGORIES = ["الكل", "صور إعلانية", "بوستات", "استراتيجية", "فيديو/ريلز", "عروض ومناسبات"];

const TEMPLATES: Template[] = [
  { cat: "صور إعلانية", title: "منتج على خلفية فاخرة", prompt: "صمّم صورة إعلانية احترافية للمنتج: [اسم المنتج]، على خلفية رخام فاخرة بإضاءة استوديو دافئة، تركيز حاد، أسلوب تصوير تجاري راقٍ، أبعاد 1:1." },
  { cat: "صور إعلانية", title: "إعلان طعام شهي", prompt: "صمّم صورة إعلانية لطبق [اسم الطبق] بإضاءة سينمائية، بخار خفيف، ألوان غنية، خلفية خشبية، أسلوب food photography احترافي، أبعاد 4:5." },
  { cat: "صور إعلانية", title: "بوستر خصم", prompt: "صمّم بوستر عرض عليه نص \"خصم 50%\"، ألوان علامتي، عنصر جذّاب في المنتصف، مساحة للنص واضحة، أبعاد 1:1." },
  { cat: "بوستات", title: "بوست إطلاق منتج", prompt: "اكتب بوست إنستجرام لإطلاق [اسم المنتج]: خطّاف قوي في أول سطر، 3 مميزات، دعوة للعمل، وهاشتاجات مناسبة." },
  { cat: "بوستات", title: "بوست قصة العلامة", prompt: "اكتب بوست يحكي قصة علامتي [اسم العلامة] بأسلوب عاطفي يبني الثقة، ويختم بدعوة لمتابعة الصفحة." },
  { cat: "بوستات", title: "بوست سؤال تفاعلي", prompt: "اكتب بوست تفاعلي يطرح سؤالاً على الجمهور المستهدف لمجال [المجال]، يشجّع على التعليقات." },
  { cat: "استراتيجية", title: "خطة محتوى شهرية", prompt: "ضع خطة محتوى شهرية (30 يوماً) لـ [نوع النشاط]: نوع كل منشور، الفكرة، المنصة، وأفضل وقت نشر." },
  { cat: "استراتيجية", title: "خطة إطلاق حملة", prompt: "ضع خطة إطلاق حملة إعلانية لـ [المنتج/العرض]: الأهداف، الجمهور، الرسالة، المنصات، الميزانية المقترحة، ومؤشرات النجاح." },
  { cat: "استراتيجية", title: "تحليل وتوصيات", prompt: "حلّل وضع صفحتي على [المنصة] لمجال [المجال]، واقترح 5 تحسينات عملية لزيادة التفاعل والوصول." },
  { cat: "فيديو/ريلز", title: "سكربت ريلز 30 ثانية", prompt: "اكتب سكربت ريلز 30 ثانية لـ [المنتج/الخدمة]: Hook قوي، المحتوى، دعوة للعمل، مع وصف المشاهد والنص على الشاشة." },
  { cat: "فيديو/ريلز", title: "برومبت فيديو منتج", prompt: "اكتب برومبت فيديو احترافي لعرض [المنتج]: نوع اللقطة، حركة الكاميرا، الإضاءة، المدة 8 ثوانٍ، أبعاد 9:16." },
  { cat: "عروض ومناسبات", title: "عرض رمضان", prompt: "اكتب حملة عرض رمضان لـ [النشاط]: فكرة العرض، نص البوست، سكربت ريل، ورسالة واتساب ترويجية." },
  { cat: "عروض ومناسبات", title: "عرض اليوم الوطني", prompt: "اكتب حملة اليوم الوطني السعودي لـ [النشاط] بروح وطنية: نص بوست، فكرة تصميم، ودعوة للعمل." },
  { cat: "عروض ومناسبات", title: "جمعة بيضاء", prompt: "اكتب حملة الجمعة البيضاء لـ [النشاط]: عنوان جذّاب، نص العرض، وإحساس بالإلحاح (FOMO)." },
];

export default function TemplatesPage() {
  const [cat, setCat] = useState("الكل");
  const [copied, setCopied] = useState<string | null>(null);

  const list = cat === "الكل" ? TEMPLATES : TEMPLATES.filter((t) => t.cat === cat);

  function copy(t: Template) {
    navigator.clipboard.writeText(t.prompt).then(() => {
      setCopied(t.title);
      toast.success("اتنسخ! الصقه في المساعد أو الأداة المناسبة");
      setTimeout(() => setCopied(null), 1500);
    });
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
          <LayoutTemplate className="size-7 text-primary" /> مكتبة القوالب
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">قوالب جاهزة — انسخ القالب، غيّر ما بين [الأقواس]، والصقه في المساعد أو الأداة المناسبة.</p>
      </div>

      {/* فلتر التصنيفات — سحب أفقي على الموبايل */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-sm border transition-all ${cat === c ? "gradient-brand text-white border-transparent" : "bg-card hover:border-primary/50"}`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((t) => (
          <Card key={t.title} className="p-5 flex flex-col hover-lift">
            <div className="text-xs text-primary font-medium mb-1">{t.cat}</div>
            <h3 className="font-semibold">{t.title}</h3>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed flex-1">{t.prompt}</p>
            <Button variant="outline" size="sm" onClick={() => copy(t)} className="mt-4 self-start">
              {copied === t.title ? <><Check className="size-3.5" /> اتنسخ</> : <><Copy className="size-3.5" /> نسخ القالب</>}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
