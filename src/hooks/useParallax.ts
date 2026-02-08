import * as React from "react";

/**
 * Parallax suave no scroll. Retorna um ref para o elemento que se move mais devagar.
 * Desabilitado automaticamente no mobile e com prefers-reduced-motion.
 */
export function useParallax<T extends HTMLElement>(speed = 0.2) {
  const ref = React.useRef<T | null>(null);
  const raf = React.useRef<number | null>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Desabilita no mobile
    if (window.innerWidth < 768) return;

    // Desabilita com reduced-motion
    const mqMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mqMotion.matches) return;

    const onScroll = () => {
      if (raf.current != null) cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(() => {
        const y = window.scrollY * speed;
        el.style.transform = `translate3d(0, ${y}px, 0)`;
      });
    };

    el.style.willChange = "transform";
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf.current != null) cancelAnimationFrame(raf.current);
    };
  }, [speed]);

  return ref;
}
