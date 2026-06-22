import type { Metadata } from "next";
import { Inter, IBM_Plex_Sans_Arabic } from "next/font/google";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { PwaRegister } from "@/components/pwa-register";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const arabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-arabic",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Oji Brain — عقلُ مشروعك الإبداعي",
  description:
    "منصةُ ذكاءٍ اصطناعيٍّ تساعدك على بناءِ استراتيجيةِ تسويق، تصاميم، وفيديوهات لمشروعك بضغطةِ زر.",
  keywords: ["AI", "تسويق", "استراتيجية", "ذكاء اصطناعي", "Oji"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Oji Brain",
  },
  openGraph: {
    title: "Oji Brain",
    description: "عقلُ مشروعك الإبداعي بالذكاء الاصطناعي",
    type: "website",
  },
};

export const viewport = {
  themeColor: "#3f6fe8",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover" as const, // دعم منطقة الأمان على آيفون (notch)
};

const SUPABASE_ORIGIN = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        {/* تسريع أول اتصال بـ Supabase (تسجيل دخول/بيانات/ملفات) — يقلّل زمن التحميل على كل الأجهزة */}
        {SUPABASE_ORIGIN && <link rel="preconnect" href={SUPABASE_ORIGIN} crossOrigin="anonymous" />}
        {SUPABASE_ORIGIN && <link rel="dns-prefetch" href={SUPABASE_ORIGIN} />}
        <link rel="preconnect" href="https://generativelanguage.googleapis.com" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.variable} ${arabic.variable} antialiased`} suppressHydrationWarning>
        <ThemeProvider>
          <PwaRegister />
          {children}
          <Toaster richColors position="top-center" dir="rtl" />
        </ThemeProvider>
      </body>
    </html>
  );
}
