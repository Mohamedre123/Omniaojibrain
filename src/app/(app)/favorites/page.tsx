"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Star, Plus, Copy, Trash2, Check } from "lucide-react";

type Fav = { id: string; name: string; content: string };
const KEY = "oji_favorites";

export default function FavoritesPage() {
  const [items, setItems] = useState<Fav[]>([]);
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [copied, setCopied] = useState("");

  useEffect(() => {
    try { setItems(JSON.parse(localStorage.getItem(KEY) || "[]")); } catch {}
  }, []);
  function persist(next: Fav[]) { setItems(next); localStorage.setItem(KEY, JSON.stringify(next)); }

  function add() {
    if (!name.trim() || !content.trim()) { toast.error("اكتب الاسم والمحتوى"); return; }
    persist([{ id: `${Date.now()}`, name: name.trim(), content: content.trim() }, ...items]);
    setName(""); setContent("");
    toast.success("اتحفظت في المفضّلة ⭐");
  }
  function copy(f: Fav) { navigator.clipboard.writeText(f.content).then(() => { setCopied(f.id); toast.success("اتنسخ"); setTimeout(() => setCopied(""), 1200); }); }
  function remove(id: string) { persist(items.filter((x) => x.id !== id)); }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2"><Star className="size-7 text-primary" /> المفضّلة</h1>
        <p className="text-muted-foreground mt-1 text-sm">احفظ برومبتاتك أو نصوصك المفضّلة وارجعلها بضغطة.</p>
      </div>

      <Card className="p-5 space-y-3 mb-5">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="اسم مختصر (مثلاً: برومبت إعلان منتج)" />
        <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={3} placeholder="الصق النص/البرومبت هنا..." dir="auto" />
        <Button onClick={add} variant="gradient" className="w-full"><Plus className="size-4" /> حفظ في المفضّلة</Button>
      </Card>

      {items.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-8">مفيش عناصر محفوظة بعد.</p>
      ) : (
        <div className="space-y-3">
          {items.map((f) => (
            <Card key={f.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-sm">{f.name}</h3>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => copy(f)} className="text-primary">{copied === f.id ? <Check className="size-4" /> : <Copy className="size-4" />}</button>
                  <button onClick={() => remove(f.id)} className="text-destructive"><Trash2 className="size-4" /></button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2 whitespace-pre-wrap line-clamp-3">{f.content}</p>
            </Card>
          ))}
        </div>
      )}
      <p className="mt-6 text-center text-xs text-muted-foreground">💾 المفضّلة محفوظة على هذا المتصفح.</p>
    </div>
  );
}
