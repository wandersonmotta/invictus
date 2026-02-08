import * as React from "react";

/**
 * Barra fina dourada no topo que mostra o progresso de scroll.
 * Desabilitada com prefers-reduced-motion.
 */
export function ScrollProgress() {
  const barRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const mqMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mqMotion.matches) return;

    let raf: number | null = null;
    const onScroll = () => {
      if (raf != null) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = barRef.current;
        if (!el) return;
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const pct = docHeight > 0 ? Math.min(scrollTop / docHeight, 1) : 0;
        el.style.transform = `scaleX(${pct})`;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf != null) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={barRef}
      aria-hidden
      className="fixed left-0 top-0 z-[60] h-[3px] w-full origin-left"
      style={{
        background: "linear-gradient(90deg, hsl(var(--gold-hot) / 0.9), hsl(var(--gold-soft) / 0.7))",
        boxShadow: "0 0 6px 1px hsl(var(--gold-hot) / 0.5)",
        transform: "scaleX(0)",
        willChange: "transform",
        pointerEvents: "none",
      }}
    />
  );
}
