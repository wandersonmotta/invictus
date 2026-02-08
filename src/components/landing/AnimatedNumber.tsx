import * as React from "react";

/**
 * Counter animado: conta de 0 até `value` quando `active` é true.
 */
export function AnimatedNumber({
  value,
  active,
  duration = 1500,
  prefix = "",
  suffix = "",
}: {
  value: number;
  active: boolean;
  duration?: number;
  prefix?: string;
  suffix?: string;
}) {
  const [display, setDisplay] = React.useState(0);
  const raf = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (!active) {
      setDisplay(0);
      return;
    }

    // Respeitar reduced-motion
    const mqMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mqMotion.matches) {
      setDisplay(value);
      return;
    }

    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value));
      if (progress < 1) {
        raf.current = requestAnimationFrame(animate);
      }
    };

    raf.current = requestAnimationFrame(animate);
    return () => {
      if (raf.current != null) cancelAnimationFrame(raf.current);
    };
  }, [active, value, duration]);

  return (
    <span>
      {prefix}
      {display.toLocaleString("pt-BR")}
      {suffix}
    </span>
  );
}
