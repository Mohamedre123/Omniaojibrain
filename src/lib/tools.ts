// سجلّ مركزي لكل أدوات الموقع — يستخدمه البحث السريع ودليل الأدوات والمفضّلة
export type Tool = { href: string; title: string; desc: string; cat: string; emoji: string; kw?: string };

export const TOOL_CATEGORIES = [
  "الأساسيات",
  "الصور والفيديو",
  "التسويق",
  "المحتوى الجاهز",
  "الرؤى والتحليلات",
  "جذب العملاء",
  "العلامة التجارية",
  "الإدارة",
];

export const TOOLS: Tool[] = [
  // الأساسيات
  { href: "/dashboard", title: "لوحة التحكّم", desc: "مشاريعك ونظرة عامة", cat: "الأساسيات", emoji: "🏠" },
  { href: "/assistant", title: "المساعد العام", desc: "اسأل عن استراتيجية وأفكار", cat: "الأساسيات", emoji: "💬", kw: "chat شات" },
  { href: "/calendar", title: "تقويم المحتوى", desc: "خطة شهرية 30 منشور", cat: "الأساسيات", emoji: "🗓️" },
  { href: "/tools", title: "دليل الأدوات", desc: "كل الأدوات في مكان واحد", cat: "الأساسيات", emoji: "🧭" },
  { href: "/automations", title: "الأتمتة والوكلاء", desc: "صمّم بوت واتساب أو أي أتمتة — والـ AI يجهّزها", cat: "الأساسيات", emoji: "⚙️", kw: "n8n automation agent بوت workflow" },
  { href: "/start", title: "ابدأ من هنا", desc: "إعداد أوّل مرّة", cat: "الأساسيات", emoji: "🚀" },

  // الصور والفيديو
  { href: "/studio", title: "استوديو الصور والفيديو", desc: "شات توليد صور وفيديو زي Gemini", cat: "الصور والفيديو", emoji: "🎨", kw: "image صور gemini" },
  { href: "/studio/shots", title: "9 لقطات (Shots)", desc: "منتجك بمشاهد سينمائية متنوّعة", cat: "الصور والفيديو", emoji: "📸" },
  { href: "/studio/tools", title: "أدوات الصور", desc: "قصّ، خلفية، ضغط، QR، علامة مائية", cat: "الصور والفيديو", emoji: "🧰" },
  { href: "/studio/edit", title: "تعديل الصور", desc: "تعديل بالـ AI", cat: "الصور والفيديو", emoji: "✏️" },
  { href: "/studio/colors", title: "استخراج الألوان", desc: "باليت من أي صورة", cat: "الصور والفيديو", emoji: "🎨" },
  { href: "/studio/watermark", title: "علامة مائية", desc: "أضف لوجوك على الصور", cat: "الصور والفيديو", emoji: "🔖" },
  { href: "/studio/qr", title: "مولّد QR", desc: "كود QR لعلامتك", cat: "الصور والفيديو", emoji: "🔳" },
  { href: "/studio/voice-over", title: "تعليق صوتي", desc: "صوت احترافي لفيديوهاتك", cat: "الصور والفيديو", emoji: "🎙️" },
  { href: "/studio/library", title: "ملفاتي", desc: "كل صورك وفيديوهاتك", cat: "الصور والفيديو", emoji: "📁" },

  // التسويق
  { href: "/marketing", title: "مركز التسويق", desc: "كل أدوات التسويق", cat: "التسويق", emoji: "📣" },
  { href: "/marketing/occasions", title: "محرّك المناسبات", desc: "حملة كاملة لأي مناسبة", cat: "التسويق", emoji: "🎉" },
  { href: "/marketing/repurpose", title: "إعادة تدوير المحتوى", desc: "فكرة → بوست وريلز وستوري وتغريدة", cat: "التسويق", emoji: "♻️" },
  { href: "/marketing/product-ad", title: "منتج → إعلان بصري", desc: "صورة منتج + عرض → إعلان جاهز", cat: "التسويق", emoji: "🖼️" },
  { href: "/marketing/mockups", title: "مولّد الموكب", desc: "تصميمك على موبايل/تيشيرت/مج", cat: "التسويق", emoji: "📱" },
  { href: "/marketing/photoshoot", title: "ثيمات جلسة تصوير", desc: "مشاهد جاهزة لمنتجك", cat: "التسويق", emoji: "📷" },
  { href: "/marketing/menu", title: "مصمّم المنيو", desc: "قائمة أسعار بلوجوك وألوانك", cat: "التسويق", emoji: "🍽️" },
  { href: "/marketing/card", title: "بطاقة عمل + بانرات", desc: "تصميم واحد لكل المنصّات", cat: "التسويق", emoji: "💳" },
  { href: "/marketing/review-card", title: "جرافيك تقييمات", desc: "ريفيو عميلك → صورة أنيقة", cat: "التسويق", emoji: "⭐" },
  { href: "/marketing/story-cover", title: "أغلفة ستوري/ريلز", desc: "غلاف 9:16 احترافي", cat: "التسويق", emoji: "📖" },
  { href: "/marketing/coupon", title: "كوبونات بصرية", desc: "كود خصم جاهز للنشر", cat: "التسويق", emoji: "🎟️" },
  { href: "/marketing/caption", title: "كابشن من صورة", desc: "ارفع صورة → كابشن وهاشتاجات", cat: "التسويق", emoji: "💬" },
  { href: "/marketing/image-to-prompt", title: "صورة → برومبت", desc: "البرومبت اللي يعيد الصورة", cat: "التسويق", emoji: "🔎" },
  { href: "/marketing/hashtags", title: "مولّد هاشتاجات", desc: "30 هاشتاج مقسّمة", cat: "التسويق", emoji: "#️⃣" },
  { href: "/marketing/ad-copy", title: "نصوص إعلانات", desc: "عناوين ووصف Google & Meta", cat: "التسويق", emoji: "📢" },
  { href: "/marketing/product-desc", title: "وصف منتج للمتاجر", desc: "وصف بيعي + SEO", cat: "التسويق", emoji: "🛍️" },
  { href: "/marketing/names", title: "مولّد الأسماء التجارية", desc: "12 اسم + دومين", cat: "التسويق", emoji: "🏷️" },
  { href: "/marketing/slogans", title: "مولّد الشعارات", desc: "10 شعارات جذّابة", cat: "التسويق", emoji: "✨" },
  { href: "/marketing/ugc", title: "سكربتات UGC", desc: "تيك توك/ريلز جاهزة للتصوير", cat: "التسويق", emoji: "🎬" },
  { href: "/marketing/storyboard", title: "ستوري بورد + تحريك Veo 3", desc: "مشاهد مترابطة + برومبت تحريك بين كل مشهدين", cat: "التسويق", emoji: "🎞️", kw: "storyboard veo motion تحريك" },
  { href: "/marketing/seo-article", title: "كاتب مقالات SEO", desc: "موضوع → مقال محسّن لجوجل جاهز للنشر", cat: "التسويق", emoji: "📰", kw: "seo سيو مقال google جوجل blog مدونة" },
  { href: "/marketing/seo-optimize", title: "محسّن السيو (SEO)", desc: "الصق محتوى → نسخة محسّنة لجوجل والسوشيال", cat: "التسويق", emoji: "🔍", kw: "seo سيو تحسين keywords كلمات مفتاحية" },
  { href: "/marketing/launch-plan", title: "مخطّط إطلاق منتج", desc: "تشويق → إطلاق → متابعة", cat: "التسويق", emoji: "🚀" },
  { href: "/marketing/competitor", title: "محلّل المنافس", desc: "الصق محتوى منافس → تحليل", cat: "التسويق", emoji: "⚔️" },
  { href: "/marketing/month-plan", title: "خطة محتوى 30 يوم", desc: "شهر كامل بوستات", cat: "التسويق", emoji: "📅" },
  { href: "/marketing/translate", title: "تحويل بين اللهجات", desc: "مصري/خليجي/شامي/فصحى/English", cat: "التسويق", emoji: "🌐" },
  { href: "/marketing/pricing", title: "حاسبة التسعير الشاملة", desc: "منتج · ربحية متجر · فريلانس", cat: "التسويق", emoji: "🧮", kw: "roas تسعير" },
  { href: "/marketing/policies", title: "سياسات المتجر", desc: "شحن/استرجاع/خصوصية جاهزة", cat: "التسويق", emoji: "📜" },
  { href: "/marketing/publisher", title: "النشر المباشر", desc: "انشر على كل المنصّات", cat: "التسويق", emoji: "📤" },
  { href: "/marketing/email", title: "Email Marketing", desc: "قوالب وسلاسل إيميل", cat: "التسويق", emoji: "📧" },
  { href: "/marketing/whatsapp", title: "قوالب واتساب", desc: "رسائل ترويجية متوافقة", cat: "التسويق", emoji: "🟢" },

  // المحتوى الجاهز
  { href: "/prompts", title: "برومبتات احترافية", desc: "برومبتات صور تتجدّد على مقاسك", cat: "المحتوى الجاهز", emoji: "✨" },
  { href: "/templates", title: "مكتبة القوالب", desc: "قوالب جاهزة تتجدّد على مقاسك", cat: "المحتوى الجاهز", emoji: "📚" },
  { href: "/favorites", title: "المفضّلة", desc: "نصوصك المحفوظة", cat: "المحتوى الجاهز", emoji: "⭐" },
  { href: "/learn", title: "تعلّم", desc: "دروس وشرح الأدوات", cat: "المحتوى الجاهز", emoji: "🎓" },

  // الرؤى والتحليلات
  { href: "/insights", title: "الرؤى والتحليلات", desc: "ذكاء تنافسي", cat: "الرؤى والتحليلات", emoji: "📊" },
  { href: "/insights/today", title: "أعمل إيه النهارده؟", desc: "مهام محتوى مقترحة لمشروعك", cat: "الرؤى والتحليلات", emoji: "🧠" },
  { href: "/insights/digest", title: "موجز أسبوعي", desc: "كل اللي عملته الأسبوع ده", cat: "الرؤى والتحليلات", emoji: "🗞️" },
  { href: "/insights/analyze", title: "تحليل الأداء بالصورة", desc: "ارفع نتائج → تحليل", cat: "الرؤى والتحليلات", emoji: "🔬" },
  { href: "/insights/persona", title: "شخصية العميل المثالي", desc: "Buyer Persona كامل", cat: "الرؤى والتحليلات", emoji: "🧑" },
  { href: "/insights/swot", title: "تحليل SWOT", desc: "قوّة وضعف وفرص وتهديدات", cat: "الرؤى والتحليلات", emoji: "🧩" },
  { href: "/insights/trends", title: "مراقب الترندات", desc: "ترندات مجالك حالياً", cat: "الرؤى والتحليلات", emoji: "🔥" },
  { href: "/insights/best-times", title: "أفضل أوقات النشر", desc: "ساعات النشر لكل منصّة", cat: "الرؤى والتحليلات", emoji: "⏰" },
  { href: "/insights/roi", title: "حاسبة ROI الإعلانات", desc: "توقّع نتائج حملتك", cat: "الرؤى والتحليلات", emoji: "📈" },

  // جذب العملاء
  { href: "/leads", title: "جذب العملاء", desc: "صفحات هبوط وشات بوت و FAQ", cat: "جذب العملاء", emoji: "🎯" },
  { href: "/leads/landing-page", title: "صفحة هبوط/بيع", desc: "صفحة منتج احترافية تشتغل فعلاً", cat: "جذب العملاء", emoji: "🌐", kw: "landing" },
  { href: "/leads/faq", title: "مولّد FAQ", desc: "أسئلة شائعة لمتجرك", cat: "جذب العملاء", emoji: "❓" },
  { href: "/leads/chatbot", title: "شات بوت للموقع", desc: "widget يردّ على عملائك", cat: "جذب العملاء", emoji: "🤖" },

  // العلامة التجارية
  { href: "/brand", title: "هوية العلامة", desc: "معالج الهوية وكتاب العلامة", cat: "العلامة التجارية", emoji: "🎭" },
  { href: "/brand/wizard", title: "معالج الهوية", desc: "10 أسئلة → كتاب علامة كامل", cat: "العلامة التجارية", emoji: "🪄" },
  { href: "/brand/manage", title: "علاماتي", desc: "احفظ وفعّل علامات متعددة + دليل PDF", cat: "العلامة التجارية", emoji: "🗂️" },
  { href: "/bio", title: "صفحة الروابط (Bio)", desc: "Link-in-bio بلوجوك", cat: "العلامة التجارية", emoji: "🔗" },
  { href: "/knowledge", title: "قاعدة المعرفة", desc: "بيانات مشروعك لكل الأدوات", cat: "العلامة التجارية", emoji: "📖" },

  // الإدارة
  { href: "/projects", title: "المشاريع", desc: "كل مشاريعك", cat: "الإدارة", emoji: "📂" },
  { href: "/tasks", title: "المهام", desc: "تتبّع مهامك", cat: "الإدارة", emoji: "✅" },
  { href: "/team", title: "الفريق", desc: "أعضاء الفريق", cat: "الإدارة", emoji: "👥" },
  { href: "/business", title: "أدوات الأعمال", desc: "أدوات إدارية", cat: "الإدارة", emoji: "💼" },
  { href: "/credits", title: "الرصيد والباقات", desc: "رصيدك، الباقات، ومفتاحك الخاص (BYOK)", cat: "الإدارة", emoji: "🪙", kw: "credit كريديت باقة اشتراك byok" },
  { href: "/settings", title: "الإعدادات", desc: "الهوية والحساب", cat: "الإدارة", emoji: "⚙️" },
];

export function searchTools(q: string): Tool[] {
  const s = q.trim().toLowerCase();
  if (!s) return TOOLS;
  return TOOLS.filter((t) =>
    (t.title + " " + t.desc + " " + t.cat + " " + (t.kw || "")).toLowerCase().includes(s)
  );
}
