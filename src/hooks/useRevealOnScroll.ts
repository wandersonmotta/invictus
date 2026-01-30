import * as React from "react";

type UseRevealOnScrollOptions = {
  rootMargin?: string;
  threshold?: number;
  once?: boolean;
};

/**
 * Revela um elemento com animação de entrada quando ele aparece na viewport.
 * Respeita prefers-reduced-motion.
 */
export function useRevealOnScroll<T extends HTMLElement>(options: UseRevealOnScrollOptions = {}) {
  const { rootMargin = "0px 0px -10% 0px", threshold = 0.15, once = true } = options;
  const ref = React.useRef<T | null>(null);
  const [visible, setVisible] = React.useState(false);
  const [reducedMotion, setReducedMotion] = React.useState(false);

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
          setVisible(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setVisible(false);
        }
      },
      { root: null, rootMargin, threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [once, reducedMotion, rootMargin, threshold]);

  const className = reducedMotion
    ? ""
    : visible
      ? "animate-in fade-in-0 slide-in-from-bottom-2"
      : "opacity-0 translate-y-2";

  return { ref, className, visible, reducedMotion } as const;
}
