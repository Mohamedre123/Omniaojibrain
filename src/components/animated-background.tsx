/**
 * خلفية ناعمة فاخرة — توهّج بنفسجي هادئ + لمسة ذهبية خفيفة.
 * CSS فقط، بلا حركة مزعجة، تعمل على الوضعين وكل الأجهزة.
 */
export function AnimatedBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background">
      {/* توهّج بنفسجي علوي */}
      <div
        className="absolute -top-40 right-[-10rem] size-[42rem] max-w-[85vw] rounded-full blur-3xl opacity-80"
        style={{ background: "radial-gradient(circle, color-mix(in oklab, var(--primary) 22%, transparent), transparent 70%)" }}
      />
      {/* لمسة ذهبية بعيدة */}
      <div
        className="absolute top-[30%] left-[-8rem] size-[30rem] max-w-[78vw] rounded-full blur-3xl opacity-50"
        style={{ background: "radial-gradient(circle, color-mix(in oklab, var(--gold) 16%, transparent), transparent 70%)" }}
      />
      {/* توهّج بنفسجي سفلي */}
      <div
        className="absolute bottom-[-12rem] left-1/3 size-[34rem] max-w-[80vw] rounded-full blur-3xl opacity-60"
        style={{ background: "radial-gradient(circle, color-mix(in oklab, var(--primary) 14%, transparent), transparent 70%)" }}
      />
      {/* خطّ ضوئي علوي رفيع */}
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, color-mix(in oklab, var(--primary) 50%, transparent), transparent)" }}
      />
    </div>
  );
}
