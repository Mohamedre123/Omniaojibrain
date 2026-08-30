"use client";

import { useEffect, useRef } from "react";

/**
 * خلفية "كوكبة" متحرّكة (Canvas): نقاط تتحرّك وتتوصّل بخطوط بلون العلامة.
 * خفيفة وأداءٌ عالٍ (rAF + سقف للنقاط + توقّف عند إخفاء التاب + احترام reduced-motion).
 */
export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0, h = 0, raf = 0;
    type P = { x: number; y: number; vx: number; vy: number };
    let pts: P[] = [];

    function resize() {
      w = canvas!.clientWidth; h = canvas!.clientHeight;
      canvas!.width = Math.floor(w * dpr); canvas!.height = Math.floor(h * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.max(28, Math.min(90, Math.floor((w * h) / 17000)));
      pts = Array.from({ length: count }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
      }));
    }

    function step() {
      ctx!.clearRect(0, 0, w, h);
      const maxDist = 140;
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, 1.6, 0, Math.PI * 2);
        ctx!.fillStyle = "rgba(150,120,255,0.85)";
        ctx!.fill();
        for (let j = i + 1; j < pts.length; j++) {
          const q = pts[j];
          const dx = p.x - q.x, dy = p.y - q.y;
          const d = Math.hypot(dx, dy);
          if (d < maxDist) {
            const a = (1 - d / maxDist) * 0.35;
            ctx!.strokeStyle = `rgba(150,120,255,${a})`;
            ctx!.lineWidth = 1;
            ctx!.beginPath();
            ctx!.moveTo(p.x, p.y);
            ctx!.lineTo(q.x, q.y);
            ctx!.stroke();
          }
        }
      }
    }

    function loop() { step(); raf = requestAnimationFrame(loop); }

    resize();
    if (reduce) step();
    else raf = requestAnimationFrame(loop);

    const onResize = () => { resize(); if (reduce) step(); };
    const onVis = () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else if (!reduce) raf = requestAnimationFrame(loop);
    };
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVis);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background">
      {/* توهّجات بلون العلامة خلف الشبكة */}
      <div className="absolute -top-48 left-1/2 -translate-x-1/2 size-[62rem] max-w-[130vw] rounded-full blur-3xl opacity-40"
        style={{ background: "radial-gradient(circle, color-mix(in oklab, var(--primary) 22%, transparent), transparent 70%)" }} />
      <div className="absolute bottom-[-16rem] right-[-6rem] size-[34rem] max-w-[75vw] rounded-full blur-3xl opacity-35"
        style={{ background: "radial-gradient(circle, color-mix(in oklab, oklch(0.66 0.21 330) 20%, transparent), transparent 70%)" }} />
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
}
