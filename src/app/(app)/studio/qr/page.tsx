"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QrCode, Download, Loader2 } from "lucide-react";

export default function QrPage() {
  const [text, setText] = useState("");
  const [color, setColor] = useState("#111827");
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);

  async function generate() {
    if (!text.trim()) { toast.error("اكتب رابطاً أو نصاً"); return; }
    setBusy(true);
    try {
      const QR = (await import("qrcode")).default;
      const dataUrl = await QR.toDataURL(text.trim(), { width: 720, margin: 2, color: { dark: color, light: "#ffffff" } });
      setUrl(dataUrl);
    } catch {
      toast.error("تعذّر التوليد");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2"><QrCode className="size-7 text-primary" /> مولّد QR Code</h1>
        <p className="text-muted-foreground mt-1 text-sm">حوّل أي رابط (موقعك، واتساب، منتج، إنستجرام) إلى كود QR جاهز للطباعة.</p>
      </div>

      <Card className="p-5 space-y-4">
        <div>
          <Label htmlFor="t">الرابط أو النص</Label>
          <Input id="t" dir="ltr" value={text} onChange={(e) => setText(e.target.value)} placeholder="https://oji-brain.site أو https://wa.me/9665..." className="mt-1" />
        </div>
        <div className="flex items-center gap-3">
          <Label htmlFor="c">لون الكود</Label>
          <input id="c" type="color" value={color} onChange={(e) => setColor(e.target.value)} className="size-10 rounded-lg border cursor-pointer" />
        </div>
        <Button onClick={generate} disabled={busy} variant="gradient" className="w-full">
          {busy ? <Loader2 className="size-4 animate-spin" /> : <QrCode className="size-4" />} توليد الكود
        </Button>
      </Card>

      {url && (
        <Card className="p-5 mt-5 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="QR" className="mx-auto size-56 rounded-lg" />
          <a href={url} download={`oji-qr-${Date.now()}.png`} className="mt-3 inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
            <Download className="size-4" /> تحميل PNG
          </a>
        </Card>
      )}
    </div>
  );
}
