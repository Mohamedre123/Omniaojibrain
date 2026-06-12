"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { listLibrary, deleteFromLibrary, type LibraryFile } from "@/lib/media-library";
import { FolderOpen, Loader2, Download, Trash2, Film, RefreshCw, Image as ImageIcon } from "lucide-react";

export default function LibraryPage() {
  const [files, setFiles] = useState<LibraryFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "image" | "video">("all");

  const load = useCallback(async () => {
    setLoading(true);
    const list = await listLibrary();
    setFiles(list);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function remove(path: string) {
    if (!confirm("متأكد من حذف الملف نهائياً؟")) return;
    const ok = await deleteFromLibrary(path);
    if (ok) {
      setFiles((p) => p.filter((f) => f.path !== path));
      toast.success("تمّ الحذف");
    } else {
      toast.error("تعذّر الحذف");
    }
  }

  const filtered = files.filter((f) => filter === "all" || f.kind === filter);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FolderOpen className="size-7 text-primary" />
            ملفاتي
          </h1>
          <p className="text-muted-foreground mt-2">
            كل الصور والفيديوهات اللي ولّدتها — محفوظة تلقائياً، مش هتضيع أبداً
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} /> تحديث
        </Button>
      </div>

      <div className="flex gap-2 mb-6">
        {([
          { v: "all", label: "الكلّ" },
          { v: "image", label: "🖼️ صور" },
          { v: "video", label: "🎬 فيديوهات" },
        ] as const).map((f) => (
          <button
            key={f.v}
            onClick={() => setFilter(f.v)}
            className={`px-4 py-2 rounded-md text-sm border transition-all ${
              filter === f.v ? "bg-primary text-primary-foreground border-primary" : "hover:border-primary/40"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-20">
          <Loader2 className="size-8 animate-spin mx-auto text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <ImageIcon className="size-12 mx-auto text-muted-foreground mb-3 opacity-40" />
          <h3 className="font-semibold">لا توجد ملفات بعد</h3>
          <p className="text-sm text-muted-foreground mt-1">
            كل صورة أو فيديو تولّده في الاستوديو هيتحفظ هنا تلقائياً
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((f) => (
            <Card key={f.path} className="overflow-hidden group">
              <div className="aspect-square bg-muted relative">
                {f.kind === "video" ? (
                  f.signedUrl ? (
                    <video src={f.signedUrl} className="w-full h-full object-cover" muted playsInline preload="metadata" />
                  ) : (
                    <div className="w-full h-full grid place-items-center"><Film className="size-10 text-muted-foreground" /></div>
                  )
                ) : f.signedUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={f.signedUrl} alt={f.name} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <div className="w-full h-full grid place-items-center"><ImageIcon className="size-10 text-muted-foreground" /></div>
                )}
                {f.kind === "video" && (
                  <span className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full">🎬 فيديو</span>
                )}
              </div>
              <div className="p-2 flex items-center justify-between gap-1">
                <span className="text-[10px] text-muted-foreground truncate flex-1">
                  {f.createdAt ? new Date(f.createdAt).toLocaleDateString("ar") : ""}
                </span>
                <div className="flex gap-1">
                  {f.signedUrl && (
                    <a
                      href={f.signedUrl}
                      download={f.name}
                      target="_blank"
                      rel="noreferrer"
                      className="size-7 rounded-md border grid place-items-center hover:bg-muted"
                      title="تنزيل"
                    >
                      <Download className="size-3.5" />
                    </a>
                  )}
                  <button
                    onClick={() => remove(f.path)}
                    className="size-7 rounded-md border grid place-items-center hover:bg-destructive/10 text-destructive"
                    title="حذف"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
