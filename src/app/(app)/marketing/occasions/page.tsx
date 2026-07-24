import { GeneratorTool } from "@/components/generator-tool";
import { CalendarHeart } from "lucide-react";

const OCCASIONS = [
  "رمضان", "عيد الفطر", "عيد الأضحى", "المولد النبوي", "رأس السنة الهجرية",
  "اليوم الوطني السعودي (23 سبتمبر)", "اليوم الوطني الإماراتي (2 ديسمبر)", "اليوم الوطني القطري (18 ديسمبر)",
  "الجمعة البيضاء / بلاك فرايداي (نوفمبر)", "العودة للمدارس (أغسطس–سبتمبر)",
  "عيد الأم (21 مارس)", "الفلانتين (14 فبراير)", "رأس السنة الميلادية",
  "موسم الصيف", "موسم الشتاء / التخفيضات", "يوم التأسيس السعودي (22 فبراير)",
];

export default function OccasionsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <GeneratorTool
        tool="occasion_pack"
        title="محرّك المناسبات — حزمة محتوى جاهزة"
        description="اختر المناسبة → حملة كاملة (كابشن + عرض + ريل + هاشتاجات + أفضل وقت) مخصّصة لنشاطك"
        icon={<CalendarHeart className="size-6" />}
        savedKind="strategy"
        fields={[
          { name: "occasion", label: "المناسبة", type: "select", required: true, options: OCCASIONS.map((o) => ({ label: o, value: o })) },
          { name: "about", label: "عن نشاطك", type: "textarea", rows: 3, required: true, placeholder: "نوع النشاط، المنتج/الخدمة، والجمهور المستهدف..." },
          { name: "offer", label: "عرض/خصم عندك بالفعل؟ (اختياري)", type: "text", required: false, placeholder: "مثلاً: خصم 25% على كل المنتجات" },
        ]}
      />
    </div>
  );
}
