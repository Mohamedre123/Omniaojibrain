import type { Metadata } from "next";
import { Inter, IBM_Plex_Sans_Arabic } from "next/font/google";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
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
  openGraph: {
    title: "Oji Brain",
    description: "عقلُ مشروعك الإبداعي بالذكاء الاصطناعي",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className={`${inter.variable} ${arabic.variable} antialiased`}>
        <ThemeProvider>
          {children}
          <Toaster richColors position="top-center" dir="rtl" />
        </ThemeProvider>
      </body>
    </html>
  );
}
