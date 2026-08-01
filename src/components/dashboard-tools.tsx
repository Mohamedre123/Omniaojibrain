"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Star, Clock, Compass } from "lucide-react";
import { TOOLS } from "@/lib/tools";
import { getFavorites, getRecents, recordRecent } from "@/lib/tool-usage";

export function DashboardTools() {
  const [favs, setFavs] = useState<string[]>([]);
  const [recents, setRecents] = useState<string[]>([]);

  useEffect(() => { setFavs(getFavorites()); setRecents(getRecents()); }, []);

  const favTools = TOOLS.filter((t) => favs.includes(t.href)).slice(0, 8);
  const recentTools = recents.map((h) => TOOLS.find((t) => t.href === h)).filter(Boolean).slice(0, 8) as typeof TOOLS;

  if (favTools.length === 0 && recentTools.length === 0) {
    return (
      <Card className="p-5 flex items-center justify-between gap-3 flex-wrap">
        <div className="text-sm">
          <div className="font-semibold flex items-center gap-1.5"><Compass className="size-4 text-primary" /> عندك أدوات كتير — لقيها بسهولة</div>
          <div className="text-muted-foreground text-xs mt-0.5">افتح دليل الأدوات أو اضغط Ctrl+K للبحث السريع، وثبّت أدواتك بالنجمة.</div>
        </div>
        <Link href="/tools" className="text-sm text-primary font-medium hover:underline shrink-0">دليل الأدوات ←</Link>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {favTools.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5"><Star className="size-4 fill-yellow-400 text-yellow-400" /> المفضّلة</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {favTools.map((t) => <Tile key={t.href} href={t.href} emoji={t.emoji} title={t.title} />)}
          </div>
        </div>
      )}
      {recentTools.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5"><Clock className="size-4 text-muted-foreground" /> آخر استخدام</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {recentTools.map((t) => <Tile key={t.href} href={t.href} emoji={t.emoji} title={t.title} />)}
          </div>
        </div>
      )}
      <Link href="/tools" className="inline-block text-sm text-primary font-medium hover:underline">كل الأدوات ←</Link>
    </div>
  );
}

function Tile({ href, emoji, title }: { href: string; emoji: string; title: string }) {
  return (
    <Link href={href} onClick={() => recordRecent(href)}>
      <Card className="p-3 flex items-center gap-2 hover:border-primary/40 hover:shadow-sm transition-all">
        <span className="text-lg shrink-0">{emoji}</span>
        <span className="text-xs font-medium truncate">{title}</span>
      </Card>
    </Link>
  );
}
