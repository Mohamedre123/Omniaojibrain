"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Star } from "lucide-react";
import { TOOLS, TOOL_CATEGORIES, searchTools } from "@/lib/tools";
import { getFavorites, toggleFavorite, recordRecent } from "@/lib/tool-usage";

export default function ToolsDirectoryPage() {
  const [q, setQ] = useState("");
  const [favs, setFavs] = useState<string[]>([]);

  useEffect(() => { setFavs(getFavorites()); }, []);

  const results = useMemo(() => searchTools(q), [q]);
  const favTools = useMemo(() => TOOLS.filter((t) => favs.includes(t.href)), [favs]);

  function onStar(e: React.MouseEvent, href: string) {
    e.preventDefault();
    toggleFavorite(href);
    setFavs(getFavorites());
  }

  const grouped = TOOL_CATEGORIES.map((cat) => ({ cat, items: results.filter((t) => t.cat === cat) })).filter((g) => g.items.length > 0);

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-5">
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">🧭 دليل الأدوات</h1>
        <p className="text-muted-foreground mt-1 text-sm">كل أدوات Oji في مكان واحد — دوّر، وثبّت أدواتك المفضّلة بالنجمة. (تقدر تفتح البحث السريع بـ Ctrl+K في أي وقت)</p>
      </div>

      <div className="relative mb-6">
        <Search className="size-4 absolute top-1/2 -translate-y-1/2 right-3 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث عن أداة…" className="pr-9" />
      </div>

      {!q && favTools.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-1.5"><Star className="size-4 fill-yellow-400 text-yellow-400" /> المفضّلة</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {favTools.map((t) => <ToolCard key={t.href} t={t} fav onStar={onStar} />)}
          </div>
        </div>
      )}

      {grouped.length === 0 ? (
        <Card className="p-10 text-center text-sm text-muted-foreground">مفيش أداة بالاسم ده</Card>
      ) : (
        grouped.map((g) => (
          <div key={g.cat} className="mb-8">
            <h2 className="text-sm font-semibold mb-3 text-muted-foreground">{g.cat}</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {g.items.map((t) => <ToolCard key={t.href} t={t} fav={favs.includes(t.href)} onStar={onStar} />)}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function ToolCard({ t, fav, onStar }: { t: (typeof TOOLS)[number]; fav?: boolean; onStar: (e: React.MouseEvent, href: string) => void }) {
  return (
    <Link href={t.href} onClick={() => recordRecent(t.href)}>
      <Card className="p-4 h-full flex items-start gap-3 hover:shadow-md hover:border-primary/40 transition-all">
        <span className="text-2xl shrink-0">{t.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm truncate">{t.title}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{t.desc}</div>
        </div>
        <button onClick={(e) => onStar(e, t.href)} className="shrink-0" title="مفضّلة">
          <Star className={`size-4 ${fav ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
        </button>
      </Card>
    </Link>
  );
}
