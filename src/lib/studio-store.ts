"use client";

// تخزين محادثات الاستوديو محلياً في IndexedDB (يتحمّل الصور والفيديوهات الكبيرة
// عكس localStorage المحدود بـ 5MB) — يشتغل على iOS / Android / Mac / Windows.

const DB_NAME = "oji-studio";
const STORE = "threads";
const VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("no indexeddb"));
      return;
    }
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** حمّل محادثة مخزّنة (image | video) */
export async function loadThread<T = unknown>(key: string): Promise<T[]> {
  try {
    const db = await openDB();
    return await new Promise<T[]>((resolve) => {
      const tx = db.transaction(STORE, "readonly");
      const r = tx.objectStore(STORE).get(key);
      r.onsuccess = () => resolve((r.result as T[]) || []);
      r.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

/** احفظ محادثة (image | video) */
export async function saveThread(key: string, value: unknown[]): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
      tx.onabort = () => resolve();
    });
  } catch {
    // تجاهل — التخزين المحلي اختياري، الوسائط محفوظة أصلاً في "ملفاتي"
  }
}

/** امسح محادثة */
export async function clearThread(key: string): Promise<void> {
  await saveThread(key, []);
}
