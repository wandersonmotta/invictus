import * as React from "react";

type UseRevealOnScrollOptions = {
  rootMargin?: string;
  threshold?: number;
  once?: boolean;
  /** Pequeno atraso para garantir que o browser “pinte” o estado inicial antes de revelar. */
  enterDelayMs?: number;
  /** Se true, não retorna classes Tailwind (útil quando você controla o motion via CSS). */
  disableClasses?: boolean;
};

/**
 * Revela um elemento com animação de entrada quando ele aparece na viewport.
 * Respeita prefers-reduced-motion.
 */
export function useRevealOnScroll<T extends HTMLElement>(options: UseRevealOnScrollOptions = {}) {
  const {
    rootMargin = "0px 0px -25% 0px",
    threshold = 0.3,
    once = true,
    enterDelayMs = 48,
    disableClasses = false,
  } = options;
  const ref = React.useRef<T | null>(null);
  const [visible, setVisible] = React.useState(false);
  const [reducedMotion, setReducedMotion] = React.useState(false);

  const raf1 = React.useRef<number | null>(null);
  const raf2 = React.useRef<number | null>(null);
  const timer = React.useRef<number | null>(null);

  const clearTimers = React.useCallback(() => {
    if (raf1.current != null) cancelAnimationFrame(raf1.current);
    if (raf2.current != null) cancelAnimationFrame(raf2.current);
    if (timer.current != null) window.clearTimeout(timer.current);
    raf1.current = null;
    raf2.current = null;
    timer.current = null;
  }, []);

  React.useEffect(() => {
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!mq) return;
    const onChange = () => setReducedMotion(!!mq.matches);
    onChange();
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  React.useEffect(() => {
    if (reducedMotion) {
      setVisible(true);
      return;
    }

    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        if (entry.isIntersecting) {
          // 2x rAF garante que o estado inicial seja renderizado antes de aplicar o “reveal”
          // (evita o efeito “já nasceu visível”, especialmente no desktop).
          clearTimers();
          raf1.current = requestAnimationFrame(() => {
            raf2.current = requestAnimationFrame(() => {
              timer.current = window.setTimeout(() => setVisible(true), Math.max(0, enterDelayMs));
            });
          });
          if (once) observer.disconnect();
        } else if (!once) {
          clearTimers();
          setVisible(false);
        }
      },
      { root: null, rootMargin, threshold }
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      clearTimers();
    };
  }, [clearTimers, enterDelayMs, once, reducedMotion, rootMargin, threshold]);

  const className = disableClasses
    ? ""
    : reducedMotion
      ? ""
      : visible
        ? "animate-in fade-in-0 slide-in-from-bottom-2"
        : "opacity-0 translate-y-2";

  return { ref, className, visible, reducedMotion } as const;
}
