import * as React from "react";

/**
 * Hook de inclinação 3D por mouse tracking.
 * Desabilitado automaticamente no mobile e com prefers-reduced-motion.
 */
export function useTilt3D<T extends HTMLElement>(maxDeg = 4) {
  const ref = React.useRef<T | null>(null);
  const raf = React.useRef<number | null>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Desabilita no mobile/touch
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    if (!mq.matches) return;

    // Desabilita com reduced-motion
    const mqMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mqMotion.matches) return;

    const onMove = (e: MouseEvent) => {
      if (raf.current != null) cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width; // 0..1
        const y = (e.clientY - rect.top) / rect.height;
        const rotateY = (x - 0.5) * maxDeg * 2; // -maxDeg..+maxDeg
        const rotateX = (0.5 - y) * maxDeg * 2;
        el.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
      });
    };

    const onLeave = () => {
      if (raf.current != null) cancelAnimationFrame(raf.current);
      el.style.transform = "";
    };

    el.style.transition = "transform 260ms cubic-bezier(0.2,0.8,0.2,1)";
    el.style.willChange = "transform";

    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);

    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
      if (raf.current != null) cancelAnimationFrame(raf.current);
      el.style.transform = "";
    };
  }, [maxDeg]);

  return ref;
}
