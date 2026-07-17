import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const THEME_BG: Record<string, string> = {
  violet: "from-violet-600 via-purple-700 to-fuchsia-700",
  blue: "from-blue-600 via-sky-700 to-cyan-700",
  emerald: "from-emerald-600 via-teal-700 to-green-700",
  rose: "from-rose-600 via-pink-700 to-fuchsia-700",
  amber: "from-amber-500 via-orange-600 to-red-600",
  dark: "from-slate-800 via-gray-900 to-black",
};

type BioLink = { label: string; url: string };

export default async function BioPublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("bio_pages").select("*").eq("slug", slug).maybeSingle();
  if (!data) notFound();

  const links = (data.links as BioLink[]) || [];
  const bg = THEME_BG[data.theme as string] || THEME_BG.violet;

  return (
    <main className={`min-h-screen bg-gradient-to-b ${bg} text-white px-4 py-12`}>
      <div className="max-w-md mx-auto text-center">
        {data.logo_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={data.logo_url as string} alt={data.title as string} className="size-24 rounded-full object-cover mx-auto border-4 border-white/30 shadow-xl" />
        )}
        <h1 className="mt-4 text-2xl font-bold">{data.title || "Oji"}</h1>
        {data.bio && <p className="mt-2 text-white/85 text-sm leading-relaxed">{data.bio as string}</p>}

        <div className="mt-8 space-y-3">
          {links.map((l, i) => (
            <a
              key={i}
              href={/^https?:\/\//i.test(l.url) ? l.url : `https://${l.url}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-xl bg-white/15 backdrop-blur border border-white/25 py-3.5 font-medium hover:bg-white/25 transition-colors"
            >
              {l.label}
            </a>
          ))}
          {links.length === 0 && <p className="text-white/70 text-sm">لا توجد روابط بعد.</p>}
        </div>

        <a href="https://oji-brain.site" className="mt-10 inline-block text-xs text-white/60 hover:text-white/90">صُنع بـ Oji Brain ⚡</a>
      </div>
    </main>
  );
}
