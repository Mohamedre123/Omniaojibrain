// نظام الكريديت — "نايم" لحد ما يتفعّل الدفع (Kashier).
// مفعّل فقط لو NEXT_PUBLIC_CREDITS_ENABLED = "true" في البيئة.
// طول ما مطفّي: كل الأدوات شغّالة بلا حدود (زي دلوقتي).

export const CREDITS_ENABLED = process.env.NEXT_PUBLIC_CREDITS_ENABLED === "true";

// تكلفة كل نوع أداة بالكريديت (1 كريديت ≈ سنت تقريباً — عدّلها زي ما تحب)
export const TOOL_COST = { text: 1, image: 10, video: 50, landing: 6 } as const;

export function costForTool(tool: string): number {
  if (/image|photo|shot|mockup|caption_from_image|image_to_prompt/i.test(tool)) return TOOL_COST.image;
  if (/video/i.test(tool)) return TOOL_COST.video;
  if (/landing/i.test(tool)) return TOOL_COST.landing;
  return TOOL_COST.text;
}

// الباقات (بالدولار) — الأسعار والكريديت تعدّلها بحيث يكون فيه ربح
export const PLANS = [
  { id: "free", name: "مجاني", priceUSD: 0, credits: 50, features: ["نصوص محدودة", "صور قليلة", "علامة مائية"] },
  { id: "pro", name: "Pro", priceUSD: 20, credits: 1500, features: ["كل أدوات المحتوى", "صور بدون حدّ يومي", "بدون علامة مائية"] },
  { id: "business", name: "Business", priceUSD: 49, credits: 5000, features: ["فيديو", "أعضاء فريق", "أولوية توليد", "دعم أسرع"] },
];

// شحنات كريديت لمرّة واحدة (لو مش عايز يجدّد)
export const CREDIT_PACKS = [
  { priceUSD: 5, credits: 300 },
  { priceUSD: 10, credits: 700 },
  { priceUSD: 20, credits: 1600 },
];

export const BYOK_PROVIDERS = [
  { id: "gemini", label: "Google Gemini", hint: "من aistudio.google.com/apikey" },
  { id: "claude", label: "Anthropic Claude", hint: "من console.anthropic.com" },
] as const;
