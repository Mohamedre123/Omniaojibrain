/**
 * خلفية Clean Dark — مسطّحة ونظيفة: شبكة نقطية خفيفة جداً + توهّج واحد خافت.
 * بدون كرات/أورورا صاخبة — إحساس Linear/Notion.
 */
export function AnimatedBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background">
      <div className="absolute inset-0 bg-grid opacity-[0.1]" />
      <div
        className="absolute -top-48 right-[-8rem] size-[38rem] max-w-[70vw] rounded-full blur-3xl opacity-60"
        style={{ background: "radial-gradient(circle, color-mix(in oklab, var(--primary) 8%, transparent), transparent 70%)" }}
      />
    </div>
  );
}
