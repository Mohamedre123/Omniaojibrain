"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, CornerDownLeft } from "lucide-react";
import { TOOLS, searchTools, type Tool } from "@/lib/tools";
import { getRecents, recordRecent } from "@/lib/tool-usage";

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const [recents, setRecents] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    function onOpen() { setOpen(true); }
    window.addEventListener("keydown", onKey);
    window.addEventListener("oji-open-palette", onOpen);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("oji-open-palette", onOpen); };
  }, []);

  useEffect(() => {
    if (open) {
      setQ(""); setActive(0);
      setRecents(getRecents());
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const results: Tool[] = useMemo(() => {
    if (!q.trim()) {
      const rec = recents.map((h) => TOOLS.find((t) => t.href === h)).filter(Boolean) as Tool[];
      const rest = TOOLS.filter((t) => !recents.includes(t.href));
      return [...rec, ...rest].slice(0, 40);
    }
    return searchTools(q).slice(0, 40);
  }, [q, recents]);

  function go(t: Tool) {
    recordRecent(t.href);
    setOpen(false);
    router.push(t.href);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); if (results[active]) go(results[active]); }
    else if (e.key === "Escape") { setOpen(false); }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-start justify-center p-4 pt-[10vh]" onClick={() => setOpen(false)}>
      <div className="w-full max-w-xl bg-card border rounded-xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 px-4 border-b">
          <Search className="size-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => { setQ(e.target.value); setActive(0); }}
            onKeyDown={onKeyDown}
            placeholder="دوّر على أي أداة… (اكتب اسم أو كلمة)"
            className="flex-1 h-12 bg-transparent outline-none text-sm"
            dir="rtl"
          />
          <kbd className="hidden sm:inline text-[10px] text-muted-foreground border rounded px-1.5 py-0.5">Esc</kbd>
        </div>

        <div className="max-h-[55vh] overflow-y-auto p-2">
          {!q.trim() && recents.length > 0 && (
            <div className="px-2 py-1 text-[10px] text-muted-foreground">آخر استخدام</div>
          )}
          {results.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">مفيش نتيجة — جرّب كلمة تانية</div>
          ) : (
            results.map((t, i) => (
              <button
                key={t.href}
                onMouseEnter={() => setActive(i)}
                onClick={() => go(t)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-right transition-colors ${i === active ? "bg-primary/10" : "hover:bg-muted/50"}`}
              >
                <span className="text-lg shrink-0">{t.emoji}</span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-medium truncate">{t.title}</span>
                  <span className="block text-[11px] text-muted-foreground truncate">{t.desc}</span>
                </span>
                <span className="text-[10px] text-muted-foreground shrink-0">{t.cat}</span>
                {i === active && <CornerDownLeft className="size-3.5 text-primary shrink-0" />}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
