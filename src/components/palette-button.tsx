"use client";

import { Search } from "lucide-react";

export function PaletteButton() {
  return (
    <button
      onClick={() => window.dispatchEvent(new Event("oji-open-palette"))}
      className="inline-flex items-center gap-2 h-9 rounded-lg border bg-background/60 px-3 text-sm text-muted-foreground hover:border-primary/50 transition-colors"
      title="بحث سريع (Ctrl+K)"
    >
      <Search className="size-4" />
      <span className="hidden sm:inline">دوّر على أداة…</span>
      <kbd className="hidden md:inline text-[10px] border rounded px-1 py-0.5">Ctrl K</kbd>
    </button>
  );
}
