import Link from "next/link";
import { Brain } from "lucide-react";
import { AnimatedBackground } from "@/components/animated-background";
import { SiteFooter } from "@/components/site-footer";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <AnimatedBackground />
      <header className="glass border-b safe-top">
        <div className="container mx-auto h-16 px-4 flex items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="size-9 rounded-lg gradient-brand grid place-items-center animate-float-slow">
              <Brain className="size-5 text-white" />
            </div>
            <span className="text-xl font-bold">Oji Brain</span>
          </Link>
        </div>
      </header>
      <div className="flex-1 grid place-items-center px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border bg-card/85 backdrop-blur-md shadow-xl p-6 animate-fade-up">{children}</div>
      </div>
      <SiteFooter />
    </div>
  );
}
