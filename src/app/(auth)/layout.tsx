import Link from "next/link";
import { Brain } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="container mx-auto h-16 px-4 flex items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="size-9 rounded-lg gradient-brand grid place-items-center">
              <Brain className="size-5 text-white" />
            </div>
            <span className="text-xl font-bold">Oji Brain</span>
          </Link>
        </div>
      </header>
      <div className="flex-1 grid place-items-center px-4 py-12">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
