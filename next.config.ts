import type { NextConfig } from "next";

const securityHeaders = [
  // HSTS — يجبر HTTPS لمدة سنة (مهم بعد ما ترفع لاستضافة بـ HTTPS)
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains; preload",
  },
  // منع تضمين الموقع في iframe (حماية من Clickjacking)
  { key: "X-Frame-Options", value: "DENY" },
  // منع المتصفح يخمن نوع الملف
  { key: "X-Content-Type-Options", value: "nosniff" },
  // التحكم في الـ Referrer
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // حماية الميكروفون والكاميرا
  { key: "Permissions-Policy", value: "camera=(), geolocation=(), microphone=(self)" },
  // CSP — أهم header (يمنع XSS لو حصل اختراق)
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' data: https://fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      "media-src 'self' blob:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://generativelanguage.googleapis.com https://api.anthropic.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

// نوع الـ output: standalone فقط لما يكون Docker (يتفعّل بمتغير بيئة)
// كده يشتغل على Vercel و Netlify و Cloudflare بدون تعديل
const useStandalone = process.env.BUILD_STANDALONE === "1";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: { bodySizeLimit: "10mb" },
  },
  poweredByHeader: false, // إخفاء X-Powered-By
  reactStrictMode: true,
  compress: true,
  // إخفاء مؤشّر Next.js (الأيقونة N) في وضع التطوير
  devIndicators: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
    ],
  },
  async headers() {
    return [
      { source: "/(.*)", headers: securityHeaders },
    ];
  },
  ...(useStandalone ? { output: "standalone" as const } : {}),
};

export default nextConfig;
