/**
 * خلفية متحرّكة موحّدة لكل الموقع (واجهة + داخل الحساب).
 * عناصر CSS فقط (fixed خلف المحتوى) — خفيفة وتعمل على كل الأجهزة وتحترم تقليل الحركة.
 */
export function AnimatedBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-[0.35]" />
      {/* كرات لونية تتحرّك ببطء */}
      <div className="absolute -top-28 -right-20 size-[38rem] max-w-[88vw] rounded-full bg-gradient-to-br from-violet-600/40 to-fuchsia-500/25 blur-3xl animate-blob" />
      <div className="absolute top-1/3 -left-20 size-[34rem] max-w-[88vw] rounded-full bg-gradient-to-br from-blue-600/35 to-cyan-400/20 blur-3xl animate-blob delay-300" />
      <div className="absolute -bottom-10 right-1/4 size-[32rem] max-w-[85vw] rounded-full bg-gradient-to-br from-pink-600/30 to-purple-500/20 blur-3xl animate-blob delay-500" />
      <div className="absolute top-1/4 left-1/3 size-[24rem] max-w-[70vw] rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-400/12 blur-3xl animate-blob delay-700" />
      {/* أشكال عائمة خفيفة */}
      <div className="absolute top-28 left-[8%] size-24 rounded-full border border-primary/20 animate-float" />
      <div className="absolute top-[55%] right-[10%] size-16 rounded-2xl border border-fuchsia-400/20 rotate-12 animate-float-slow" />
      <div className="absolute bottom-24 left-[20%] size-3 rounded-full bg-primary/40 animate-float-slow" />
      <div className="absolute top-[40%] right-[28%] size-2.5 rounded-full bg-fuchsia-400/50 animate-float" />
    </div>
  );
}
