"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    (async () => {
      let hadStale = false;

      // 1) أزل أي Service Worker قديم كان بيخزّن نسخة قديمة (cache stale)
      if ("serviceWorker" in navigator) {
        try {
          const regs = await navigator.serviceWorker.getRegistrations();
          if (regs.length > 0) hadStale = true;
          await Promise.all(regs.map((r) => r.unregister().catch(() => {})));
        } catch { /* تجاهل */ }

        navigator.serviceWorker.addEventListener("message", (event) => {
          if (event.data?.type === "SW_UPDATED_RELOAD") window.location.reload();
        });
      }

      // 2) امسح كل الـ caches المخزّنة
      if ("caches" in window) {
        try {
          const keys = await caches.keys();
          if (keys.length > 0) hadStale = true;
          await Promise.all(keys.map((k) => caches.delete(k)));
        } catch { /* تجاهل */ }
      }

      // 3) لو لقينا نسخة قديمة مخزّنة → أعِد التحميل مرّة واحدة لجلب أحدث نسخة
      //    (محميّ بعلامة في sessionStorage عشان ما يحصلش لوب)
      if (hadStale && !sessionStorage.getItem("oji-cache-purged")) {
        sessionStorage.setItem("oji-cache-purged", "1");
        window.location.reload();
      }
    })();
  }, []);

  return null;
}
