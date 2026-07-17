import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Wand2, Stamp, Crop, FileArchive, QrCode, Palette, Layers, FolderOpen, ArrowRight, Aperture } from "lucide-react";

const TOOLS = [
  { href: "/studio/shots", icon: Aperture, title: "9 لقطات (Shots)", desc: "صورة منتج → 9 زوايا بنفس الهوية", color: "from-rose-500 to-orange-600" },
  { href: "/studio/edit", icon: Wand2, title: "تحرير الصور", desc: "إزالة خلفية (PNG شفاف) وتعديلات ذكية", color: "from-violet-500 to-purple-600" },
  { href: "/studio/watermark", icon: Stamp, title: "علامة مائية / لوجو", desc: "حطّ لوجوك على الصور", color: "from-rose-500 to-pink-600" },
  { href: "/studio/resize", icon: Crop, title: "تغيير المقاس", desc: "اضبط مقاس أي منصّة تلقائياً", color: "from-blue-500 to-cyan-600" },
  { href: "/studio/compress", icon: FileArchive, title: "ضغط وتحويل", desc: "صغّر الحجم وحوّل JPG/WebP/PNG", color: "from-amber-500 to-orange-600" },
  { href: "/studio/qr", icon: QrCode, title: "مولّد QR Code", desc: "رابط → كود QR جاهز", color: "from-slate-500 to-gray-700" },
  { href: "/studio/colors", icon: Palette, title: "استخراج ألوان", desc: "لوحة ألوان من أي صورة", color: "from-fuchsia-500 to-pink-600" },
  { href: "/studio/bulk", icon: Layers, title: "توليد بالجملة", desc: "حتى 8 صور دفعة واحدة", color: "from-teal-500 to-emerald-600" },
  { href: "/studio/library", icon: FolderOpen, title: "ملفاتي", desc: "كل مخرجاتك محفوظة", color: "from-indigo-500 to-blue-600" },
];

export default function StudioToolsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">🧰 أدوات الصور</h1>
          <p className="text-muted-foreground mt-1 text-sm">كل أدوات الصور في مكان واحد — تشتغل على المتصفح بسرعة.</p>
        </div>
        <Link href="/studio" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary shrink-0"><ArrowRight className="size-4" /> الاستوديو</Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TOOLS.map((t) => (
          <Link key={t.href} href={t.href}>
            <Card className="p-5 h-full hover-lift">
              <div className={`size-11 rounded-xl bg-gradient-to-br ${t.color} grid place-items-center text-white mb-3`}><t.icon className="size-6" /></div>
              <h3 className="font-semibold">{t.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{t.desc}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
