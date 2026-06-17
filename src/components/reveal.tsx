"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/** يكشف العنصر بأنيميشن لطيف عند ظهوره أثناء التمرير (يعمل على كل الأجهزة) */
export function Reveal({
  children,
  delay = 0,
  className = "",
  as: Tag = "div",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  as?: React.ElementType;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShow(true);
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={cn(
        "transition-all duration-700 ease-out will-change-transform",
        show ? "opacity-100 translate-y-0 blur-0" : "opacity-0 translate-y-8 blur-[2px]",
        className
      )}
    >
      {children}
    </Tag>
  );
}
