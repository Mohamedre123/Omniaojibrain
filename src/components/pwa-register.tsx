"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    // فقط في الـ Production
    if (window.location.hostname === "localhost") return;

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .catch(() => {
        // ignore registration errors silently
      });
  }, []);

  return null;
}
