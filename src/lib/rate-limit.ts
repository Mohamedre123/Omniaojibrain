/**
 * Rate Limiter بسيط في الذاكرة — مناسب لـ MVP.
 * لما يكبر الموقع نستبدله بـ Upstash Redis (سطر واحد تغيير).
 *
 * يحمي من:
 * - الـ Spam على الـ Chat (استهلاك زيادة لـ Gemini)
 * - الـ Brute Force على Auth
 */

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

// تنظيف دوري للذاكرة كل 5 دقائق
let cleanupTimer: NodeJS.Timeout | null = null;
function ensureCleanup() {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt < now) buckets.delete(key);
    }
  }, 5 * 60 * 1000);
}

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetIn: number; // seconds
};

export function rateLimit(opts: {
  key: string;
  limit: number;       // عدد المحاولات
  windowSeconds: number;
}): RateLimitResult {
  ensureCleanup();
  const now = Date.now();
  const bucket = buckets.get(opts.key);

  if (!bucket || bucket.resetAt < now) {
    buckets.set(opts.key, { count: 1, resetAt: now + opts.windowSeconds * 1000 });
    return { allowed: true, remaining: opts.limit - 1, resetIn: opts.windowSeconds };
  }

  bucket.count += 1;
  const resetIn = Math.ceil((bucket.resetAt - now) / 1000);

  if (bucket.count > opts.limit) {
    return { allowed: false, remaining: 0, resetIn };
  }

  return { allowed: true, remaining: opts.limit - bucket.count, resetIn };
}

/** للحصول على IP من الـ request (للـ rate limit على Auth). */
export function getClientIP(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headers.get("x-real-ip") ??
    "unknown"
  );
}
