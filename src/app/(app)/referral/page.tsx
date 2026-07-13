"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { Gift, Copy, Check, MessageCircle, Share2, Loader2 } from "lucide-react";

export default function ReferralPage() {
  const [link, setLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const origin = typeof window !== "undefined" ? window.location.origin : "";
        setLink(`${origin}/signup?ref=${user.id.slice(0, 8)}`);
      }
      setLoading(false);
    })();
  }, []);

  function copy() {
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      toast.success("اتنسخ الرابط!");
      setTimeout(() => setCopied(false), 1500);
    });
  }

  const shareText = encodeURIComponent(`جرّب Oji Brain — منصة الذكاء الاصطناعي للتسويق 🚀\n${link}`);

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-6 text-center">
        <div className="mx-auto size-16 rounded-2xl gradient-brand grid place-items-center mb-4 animate-float-slow">
          <Gift className="size-8 text-white" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold">ادعُ أصدقاءك واكسب</h1>
        <p className="text-muted-foreground mt-2 text-sm">شارك رابطك الخاص — وكل صديق يسجّل ويشترك عن طريقك، تكسب كريديت مجاني. 🎁</p>
      </div>

      <Card className="p-5">
        <p className="text-sm font-medium mb-2">رابط الإحالة الخاص بك</p>
        {loading ? (
          <div className="h-11 grid place-items-center"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 h-11 px-3 rounded-lg border bg-muted/40 grid items-center text-sm truncate" dir="ltr">{link}</div>
            <Button onClick={copy} variant="gradient" className="shrink-0">
              {copied ? <><Check className="size-4" /> اتنسخ</> : <><Copy className="size-4" /> نسخ</>}
            </Button>
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 gap-2">
          <a href={`https://wa.me/?text=${shareText}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-1.5 h-10 rounded-lg border text-sm hover:bg-accent">
            <MessageCircle className="size-4 text-emerald-500" /> واتساب
          </a>
          <a href={`https://twitter.com/intent/tweet?text=${shareText}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-1.5 h-10 rounded-lg border text-sm hover:bg-accent">
            <Share2 className="size-4" /> X / تويتر
          </a>
        </div>
      </Card>

      <div className="mt-6 grid sm:grid-cols-3 gap-3 text-center">
        {[
          { n: "1", t: "شارك رابطك", d: "ابعته لأصحابك وعملائك" },
          { n: "2", t: "يسجّلوا ويشتركوا", d: "عن طريق رابطك" },
          { n: "3", t: "تكسب كريديت", d: "يُضاف لرصيدك تلقائياً" },
        ].map((s) => (
          <Card key={s.n} className="p-4">
            <div className="mx-auto size-9 rounded-full gradient-brand text-white grid place-items-center font-bold mb-2">{s.n}</div>
            <h3 className="font-semibold text-sm">{s.t}</h3>
            <p className="text-xs text-muted-foreground mt-1">{s.d}</p>
          </Card>
        ))}
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">🎁 مكافآت الكريديت تُفعّل تلقائياً بمجرد تفعيل نظام الباقات والدفع.</p>
    </div>
  );
}
