/**
 * خلفية متحرّكة موحّدة لكل الموقع (واجهة + داخل الحساب).
 * طبقة Aurora دوّارة + كرات لونية + شبكة خفيفة — CSS فقط، خفيفة وتعمل على كل الأجهزة.
 */
export function AnimatedBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* شبكة خفيفة */}
      <div className="absolute inset-0 bg-grid opacity-[0.3]" />

      {/* طبقة Aurora دوّارة — مخفية على الموبايل لتفادي مشاكل العرض/الاختفاء */}
      <div
        className="hidden md:block absolute left-1/2 top-1/2 size-[120vmax] -translate-x-1/2 -translate-y-1/2 blur-2xl opacity-50 animate-aurora"
        style={{
          background:
            "conic-gradient(from 0deg, oklch(0.55 0.19 255 / 0.30), oklch(0.66 0.15 210 / 0.24), oklch(0.66 0.21 330 / 0.26), oklch(0.6 0.18 160 / 0.18), oklch(0.55 0.19 255 / 0.30))",
        }}
      />

      {/* كرات لونية تتحرّك ببطء */}
      <div className="absolute -top-24 -right-16 size-[30rem] max-w-[80vw] rounded-full bg-gradient-to-br from-indigo-600/30 to-blue-500/18 blur-2xl animate-blob" />
      <div className="absolute top-1/3 -left-20 size-[28rem] max-w-[80vw] rounded-full bg-gradient-to-br from-cyan-500/25 to-sky-400/15 blur-2xl animate-blob delay-300" />
      <div className="absolute -bottom-12 right-1/4 size-[26rem] max-w-[78vw] rounded-full bg-gradient-to-br from-fuchsia-600/24 to-pink-500/15 blur-2xl animate-blob delay-500" />

      {/* أشكال عائمة خفيفة */}
      <div className="absolute top-28 left-[8%] size-24 rounded-full border border-primary/20 animate-float" />
      <div className="absolute top-[55%] right-[10%] size-16 rounded-2xl border border-cyan-400/20 rotate-12 animate-float-slow" />
      <div className="absolute bottom-24 left-[20%] size-3 rounded-full bg-primary/40 animate-float-slow" />
      <div className="absolute top-[40%] right-[28%] size-2.5 rounded-full bg-cyan-400/50 animate-float" />
    </div>
  );
}
