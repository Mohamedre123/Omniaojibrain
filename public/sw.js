// Oji Brain — Service Worker
// عُطّل لمنع مشاكل cache stale عند الـ deploys المتكرّرة
// لو حابب تفعّله مستقبلاً، استرجع نسخة قديمة من git history.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // امسح أيّ Caches قديمة كانت محفوظة
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
      // أبلغ كل التابات تتجدّد
      const clients = await self.clients.matchAll({ type: "window" });
      for (const client of clients) {
        client.postMessage({ type: "SW_UPDATED_RELOAD" });
      }
      await self.clients.claim();
    })()
  );
});

// لا نتدخّل في الـ fetch — كل شيء يمرّ مباشرة للشبكة (لا cache)
self.addEventListener("fetch", () => {
  // فارغ عمداً
});
