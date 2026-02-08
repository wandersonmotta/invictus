import * as React from "react";

/**
 * Magnetic hover — o elemento se desloca sutilmente na direção do cursor.
 * Desktop-only, desabilitado com prefers-reduced-motion.
 */
export function useMagneticHover<T extends HTMLElement>(strength = 0.3) {
  const ref = React.useRef<T | null>(null);
  const raf = React.useRef<number | null>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    if (!mq.matches) return;
    const mqMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mqMotion.matches) return;

    const onMove = (e: MouseEvent) => {
      if (raf.current != null) cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = (e.clientX - cx) * strength;
        const dy = (e.clientY - cy) * strength;
        el.style.transform = `translate(${dx}px, ${dy}px)`;
      });
    };

    const onLeave = () => {
      if (raf.current != null) cancelAnimationFrame(raf.current);
      el.style.transform = "";
    };

    el.addEventListener("mousemove", onMove, { passive: true });
    el.addEventListener("mouseleave", onLeave, { passive: true });
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
      if (raf.current != null) cancelAnimationFrame(raf.current);
    };
  }, [strength]);

  return ref;
}
