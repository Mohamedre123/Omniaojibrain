/**
 * خلفية "Console" — مسطّحة تقنية: شبكة نقطية دقيقة + خطّ ضوئي علوي رفيع.
 * بلا كرات أو حركة — الطابع التقني الحاد. تعمل على الوضعين والأجهزة كلها.
 */
export function AnimatedBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background">
      {/* شبكة نقطية */}
      <div className="absolute inset-0 dot-grid opacity-70" />

      {/* توهّج علوي خفيف جداً بلون الأكسنت */}
      <div
        className="absolute inset-x-0 top-0 h-64"
        style={{
          background:
            "radial-gradient(900px 260px at 50% -40%, color-mix(in oklab, var(--primary) 14%, transparent), transparent 70%)",
        }}
      />

      {/* خطّ ضوئي علوي */}
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, color-mix(in oklab, var(--primary) 55%, transparent), transparent)",
        }}
      />

      {/* تلاشٍ سفلي خفيف */}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />
    </div>
  );
}
