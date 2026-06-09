"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    // أزل Service Workers قديمة كانت تسبّب مشاكل cache
    navigator.serviceWorker.getRegistrations().then((regs) => {
      for (const reg of regs) {
        reg.unregister().catch(() => {});
      }
    }).catch(() => {});

    // امسح أي caches قديمة
    if ("caches" in window) {
      caches.keys().then((keys) => {
        keys.forEach((k) => caches.delete(k));
      }).catch(() => {});
    }

    // استمع لرسالة الـ SW عشان نعمل reload لو تحدّث
    navigator.serviceWorker.addEventListener("message", (event) => {
      if (event.data?.type === "SW_UPDATED_RELOAD") {
        window.location.reload();
      }
    });
  }, []);

  return null;
}
