"use client";

// مفضّلة وآخر الأدوات المستخدمة — محفوظة في المتصفّح
const FAV_KEY = "oji_fav_tools";
const RECENT_KEY = "oji_recent_tools";

function read(key: string): string[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(key) || "[]") as string[]; } catch { return []; }
}
function write(key: string, v: string[]) {
  try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* ignore */ }
}

export function getFavorites(): string[] { return read(FAV_KEY); }
export function isFavorite(href: string): boolean { return read(FAV_KEY).includes(href); }
export function toggleFavorite(href: string): boolean {
  const cur = read(FAV_KEY);
  const next = cur.includes(href) ? cur.filter((h) => h !== href) : [href, ...cur];
  write(FAV_KEY, next);
  return next.includes(href);
}

export function getRecents(): string[] { return read(RECENT_KEY); }
export function recordRecent(href: string) {
  const cur = read(RECENT_KEY).filter((h) => h !== href);
  write(RECENT_KEY, [href, ...cur].slice(0, 12));
}
