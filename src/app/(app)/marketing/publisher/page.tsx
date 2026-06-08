"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Share2, Copy, ExternalLink, Info, MessageCircle, Twitter, Facebook, Linkedin,
  Calendar, Send,
} from "lucide-react";

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
    if (!imageUrl.trim()) {
      window.open(`https://www.linkedin.com/feed/?shareActive&mini=true&text=${encodeURIComponent(text)}`, "_blank");
    } else {
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(imageUrl)}`, "_blank");
    }
  }

  function telegramShare() {
    if (!text.trim()) { toast.error("اكتب النصّ"); return; }
    window.open(`https://t.me/share/url?url=${encodeURIComponent(imageUrl || text)}&text=${encodeURIComponent(text)}`, "_blank");
  }

  function copyForInstagram() {
    if (!text.trim()) { toast.error("اكتب النصّ"); return; }
    navigator.clipboard.writeText(text);
    toast.success("اتنسخ! افتح إنستجرام والصق");
    window.open("https://www.instagram.com", "_blank");
  }

  function copyForTikTok() {
    if (!text.trim()) { toast.error("اكتب النصّ"); return; }
    navigator.clipboard.writeText(text);
    toast.success("اتنسخ! افتح TikTok والصق في caption");
    window.open("https://www.tiktok.com/upload", "_blank");
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Share2 className="size-7 text-primary" />
          النشر المباشر
        </h1>
        <p className="text-muted-foreground mt-2">
          انشر بنقرة على كلّ منصّات السوشيال — أو جدول الأسبوع كاملاً عبر أدوات متخصّصة
        </p>
      </div>

      <Card className="p-4 mb-4 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 flex items-start gap-2 text-sm">
        <Info className="size-4 text-emerald-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-emerald-900 dark:text-emerald-200">✅ كلّ الأزرار شغّالة فوراً بدون أيّ API</p>
          <p className="text-emerald-700 dark:text-emerald-300 text-xs leading-relaxed">
            بنستخدم <strong>Share Dialogs</strong> الرسمية من كلّ منصّة — مع كل ضغطة بتفتحلك تابة جديدة جاهزة للنشر مع النصّ والصورة، فقط تأكد واضغط &quot;نشر&quot;. أمان كامل، بدون كلمة سرّ، بدون API.
          </p>
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
          <Label htmlFor="img">رابط الصورة/المحتوى (اختياري)</Label>
          <Input id="img" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." className="mt-1" />
        </div>

        <div>
          <p className="text-sm font-semibold mb-2 flex items-center gap-2">
            <Send className="size-4 text-primary" /> النشر الفوري
          </p>
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
            <Button onClick={telegramShare} className="bg-[#229ED9] hover:bg-[#1a7fb8] text-white">
              <Send className="size-4" /> Telegram
            </Button>
            <Button onClick={copyForInstagram} variant="outline">
              <Copy className="size-4" /> Instagram (نسخ + فتح)
            </Button>
            <Button onClick={copyForTikTok} variant="outline">
              <Copy className="size-4" /> TikTok (نسخ + فتح)
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            💡 إنستجرام/تيك توك مغلقين أمام أيّ نشر تلقائي من خارج تطبيقهم — لذا ننسخ النصّ ونفتح المنصّة لك مباشرة لتلصقه وتنشر.
          </p>
        </div>

        <div className="border-t pt-4">
          <p className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Calendar className="size-4 text-primary" />
            للجدولة الاحترافية (انشر للأسبوع كله مرّة واحدة)
          </p>
          <p className="text-xs text-muted-foreground mb-3">
            هذي أدوات مجانية متخصّصة في جدولة المنشورات — بتربط حساباتك مرّة واحدة وتجدول كل المحتوى مسبقاً.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <a href="https://buffer.com" target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 rounded-md border hover:border-primary hover:bg-accent/30 transition-all">
              <div>
                <div className="font-medium">Buffer</div>
                <div className="text-xs text-muted-foreground">3 حسابات + 10 منشورات مجاناً</div>
              </div>
              <ExternalLink className="size-3" />
            </a>
            <a href="https://later.com" target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 rounded-md border hover:border-primary hover:bg-accent/30 transition-all">
              <div>
                <div className="font-medium">Later</div>
                <div className="text-xs text-muted-foreground">Visual planning للسوشيال</div>
              </div>
              <ExternalLink className="size-3" />
            </a>
            <a href="https://metricool.com" target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 rounded-md border hover:border-primary hover:bg-accent/30 transition-all">
              <div>
                <div className="font-medium">Metricool</div>
                <div className="text-xs text-muted-foreground">جدولة + تحليلات شاملة</div>
              </div>
              <ExternalLink className="size-3" />
            </a>
            <a href="https://publer.io" target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 rounded-md border hover:border-primary hover:bg-accent/30 transition-all">
              <div>
                <div className="font-medium">Publer</div>
                <div className="text-xs text-muted-foreground">3 حسابات مجاناً</div>
              </div>
              <ExternalLink className="size-3" />
            </a>
            <a href="https://hootsuite.com" target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 rounded-md border hover:border-primary hover:bg-accent/30 transition-all">
              <div>
                <div className="font-medium">Hootsuite</div>
                <div className="text-xs text-muted-foreground">للوكالات والفرق</div>
              </div>
              <ExternalLink className="size-3" />
            </a>
            <a href="https://business.facebook.com/creatorstudio" target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 rounded-md border hover:border-primary hover:bg-accent/30 transition-all">
              <div>
                <div className="font-medium">Meta Creator Studio</div>
                <div className="text-xs text-muted-foreground">مجاني — جدولة Instagram + Facebook</div>
              </div>
              <ExternalLink className="size-3" />
            </a>
          </div>
        </div>
      </Card>
    </div>
  );
}
