"use client";

import { useState, useEffect } from "react";
import { X, Rocket } from "lucide-react";

/** بانر ترويجي لمنصّة إنشاء المواقع — يوجّه لـ oji-builder.site (يُغلق ويُحفظ الإغلاق محلياً) */
export function PromoBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      setShow(localStorage.getItem("oji_promo_dismissed") !== "1");
    } catch {
      setShow(true);
    }
  }, []);

  if (!show) return null;

  return (
    <div className="relative gradient-brand text-white">
      <a
        href="http://oji-builder.site/"
        target="_blank"
        rel="noopener noreferrer"
        className="block text-center text-xs sm:text-sm py-2 px-9 hover:opacity-95 transition-opacity animate-shine"
      >
        <span className="inline-flex items-center gap-2 justify-center flex-wrap">
          <Rocket className="size-4 shrink-0" />
          جرّب <b>Oji Site Builder</b> — منصّة إنشاء المواقع الاحترافية في دقائق ✨
          <span className="underline underline-offset-2">ابدأ الآن</span>
        </span>
      </a>
      <button
        onClick={() => {
          try { localStorage.setItem("oji_promo_dismissed", "1"); } catch {}
          setShow(false);
        }}
        className="absolute top-1/2 -translate-y-1/2 left-2 size-6 grid place-items-center rounded hover:bg-white/20"
        aria-label="إغلاق"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
