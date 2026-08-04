/**
 * خلفية "Dark Premium" موحّدة لكل الموقع (واجهة + داخل الحساب).
 * قاعدة فحمية هادئة + توهّج نيون خفيف + شبكة دقيقة + خطّ ضوئي علوي.
 * CSS فقط — خفيفة وتعمل على كل الأجهزة، ومحايدة تماماً بلا حركة مزعجة.
 */
export function AnimatedBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* طبقة القاعدة — تدرّج عمودي خفيف يعطي عمقاً */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(1200px 680px at 50% -16%, color-mix(in oklab, var(--primary) 12%, transparent), transparent 62%)",
        }}
      />

      {/* شبكة دقيقة جداً */}
      <div className="absolute inset-0 bg-grid opacity-[0.22]" />

      {/* خطّ ضوئي علوي رفيع بلون الأكسنت */}
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, color-mix(in oklab, var(--primary) 60%, transparent), transparent)",
        }}
      />

      {/* توهّجان ناعمان ثابتان — رزانة premium بدل الكرات الملوّنة */}
      <div
        className="absolute -top-32 right-[-8rem] size-[34rem] max-w-[80vw] rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, color-mix(in oklab, var(--primary) 16%, transparent), transparent 70%)" }}
      />
      <div
        className="absolute bottom-[-10rem] left-[-6rem] size-[30rem] max-w-[78vw] rounded-full blur-3xl opacity-70"
        style={{ background: "radial-gradient(circle, color-mix(in oklab, var(--primary) 10%, transparent), transparent 70%)" }}
      />

      {/* تعتيم سفلي خفيف يثبّت المحتوى */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/40" />
    </div>
  );
}
