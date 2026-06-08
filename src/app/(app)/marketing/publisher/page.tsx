"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Share2, Send, Copy, ExternalLink, Info, MessageCircle, Twitter, Facebook, Linkedin } from "lucide-react";

export default function PublisherPage() {
  const [text, setText] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  function whatsappShare() {
    if (!text.trim()) { toast.error("اكتب النصّ"); return; }
    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encoded}`, "_blank");
  }

  function twitterShare() {
    if (!text.trim()) { toast.error("اكتب النصّ"); return; }
    const encoded = encodeURIComponent(text);
    window.open(`https://twitter.com/intent/tweet?text=${encoded}`, "_blank");
  }

  function facebookShare() {
    if (!imageUrl.trim()) {
      window.open(`https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(text)}`, "_blank");
    } else {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(imageUrl)}&quote=${encodeURIComponent(text)}`, "_blank");
    }
  }

  function linkedinShare() {
    if (!imageUrl.trim()) { toast.error("LinkedIn يحتاج URL للمحتوى"); return; }
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(imageUrl)}`, "_blank");
  }

  function copyForInstagram() {
    navigator.clipboard.writeText(text);
    toast.success("اتنسخ! افتح إنستجرام والصق");
  }

  function copyForTikTok() {
    navigator.clipboard.writeText(text);
    toast.success("اتنسخ! افتح TikTok والصق في caption");
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Share2 className="size-7 text-primary" />
          النشر المباشر
        </h1>
        <p className="text-muted-foreground mt-2">
          انشر مباشرة على كل منصّات السوشيال من مكان واحد
        </p>
      </div>

      <Card className="p-3 mb-4 bg-blue-50 dark:bg-blue-950/30 border-blue-300 flex items-start gap-2 text-sm">
        <Info className="size-4 text-blue-600 shrink-0 mt-0.5" />
        <div>
          النشر التلقائي على إنستجرام/فيسبوك يحتاج Meta Business API + OAuth (تحت التطوير). دلوقتي تقدر تنشر بسرعة عبر الـ Share Dialogs.
        </div>
      </Card>

      <Card className="p-5 space-y-4">
        <div>
          <Label htmlFor="text">نصّ المنشور</Label>
          <Textarea
            id="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            placeholder="اكتب نصّك هنا..."
            className="mt-1"
          />
          <div className="text-xs text-muted-foreground mt-1">{text.length} حرف</div>
        </div>

        <div>
          <Label htmlFor="img">رابط الصورة/المحتوى (اختياري للسوشيال)</Label>
          <Input id="img" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." className="mt-1" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          <Button onClick={whatsappShare} className="bg-green-600 hover:bg-green-700 text-white">
            <MessageCircle className="size-4" /> WhatsApp
          </Button>
          <Button onClick={twitterShare} className="bg-black text-white hover:bg-black/80">
            <Twitter className="size-4" /> X (Twitter)
          </Button>
          <Button onClick={facebookShare} className="bg-[#1877f2] hover:bg-[#1565c5] text-white">
            <Facebook className="size-4" /> Facebook
          </Button>
          <Button onClick={linkedinShare} className="bg-[#0077b5] hover:bg-[#005f8f] text-white">
            <Linkedin className="size-4" /> LinkedIn
          </Button>
          <Button onClick={copyForInstagram} variant="outline">
            <Copy className="size-4" /> Instagram (نسخ)
          </Button>
          <Button onClick={copyForTikTok} variant="outline">
            <Copy className="size-4" /> TikTok (نسخ)
          </Button>
        </div>

        <div className="border-t pt-4">
          <p className="text-sm font-medium mb-3">📱 نشر سريع لمنصّات إضافية</p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <a href="https://business.facebook.com/creatorstudio" target="_blank" rel="noreferrer" className="flex items-center justify-between p-2 rounded-md border hover:border-primary">
              <span>Meta Creator Studio</span>
              <ExternalLink className="size-3" />
            </a>
            <a href="https://buffer.com" target="_blank" rel="noreferrer" className="flex items-center justify-between p-2 rounded-md border hover:border-primary">
              <span>Buffer (جدولة)</span>
              <ExternalLink className="size-3" />
            </a>
            <a href="https://later.com" target="_blank" rel="noreferrer" className="flex items-center justify-between p-2 rounded-md border hover:border-primary">
              <span>Later (Visual Planning)</span>
              <ExternalLink className="size-3" />
            </a>
            <a href="https://hootsuite.com" target="_blank" rel="noreferrer" className="flex items-center justify-between p-2 rounded-md border hover:border-primary">
              <span>Hootsuite</span>
              <ExternalLink className="size-3" />
            </a>
          </div>
        </div>
      </Card>
    </div>
  );
}
