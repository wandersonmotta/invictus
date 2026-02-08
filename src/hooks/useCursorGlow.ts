import * as React from "react";

/**
 * Cursor glow — rastreia o mouse e injeta --glow-x / --glow-y no elemento.
 * Desktop-only, desabilitado com prefers-reduced-motion.
 */
export function useCursorGlow<T extends HTMLElement>() {
  const ref = React.useRef<T | null>(null);
  const raf = React.useRef<number | null>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Skip touch devices
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    if (!mq.matches) return;

    const mqMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mqMotion.matches) return;

    const onMove = (e: MouseEvent) => {
      if (raf.current != null) cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        el.style.setProperty("--glow-x", `${x}px`);
        el.style.setProperty("--glow-y", `${y}px`);
        el.style.setProperty("--glow-opacity", "1");
      });
    };

    const onLeave = () => {
      if (raf.current != null) cancelAnimationFrame(raf.current);
      el.style.setProperty("--glow-opacity", "0");
    };

    el.addEventListener("mousemove", onMove, { passive: true });
    el.addEventListener("mouseleave", onLeave, { passive: true });
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
      if (raf.current != null) cancelAnimationFrame(raf.current);
    };
  }, []);

  return ref;
}
