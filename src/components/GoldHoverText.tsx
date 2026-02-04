import * as React from "react";

type GoldHoverTextProps = {
  children: React.ReactNode;
  className?: string;
  /** Intensidade do brilho (0–1). Default: 1 */
  intensity?: number;
};

/**
 * Texto premium com "dourado seguindo o mouse".
 * Usa tokens HSL do design system (primary / gold-soft / gold-hot).
 * Otimizado com throttle para ~60fps.
 */
export const GoldHoverText = React.forwardRef<HTMLSpanElement, GoldHoverTextProps>(
  ({ children, className, intensity = 1 }, forwardedRef) => {
    const ref = React.useRef<HTMLSpanElement | null>(null);
    const [active, setActive] = React.useState(false);
    const [pos, setPos] = React.useState({ x: 50, y: 50 });
    const lastUpdate = React.useRef(0);

    const updateFromEvent = React.useCallback((e: React.MouseEvent<HTMLSpanElement>) => {
      // Throttle a ~60fps (16ms)
      const now = Date.now();
      if (now - lastUpdate.current < 16) return;
      lastUpdate.current = now;

      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setPos({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
    }, []);

    return (
      <span
        ref={(node) => {
          ref.current = node;
          if (typeof forwardedRef === "function") forwardedRef(node);
          else if (forwardedRef) (forwardedRef as React.MutableRefObject<HTMLSpanElement | null>).current = node;
        }}
        onMouseEnter={(e) => {
          setActive(true);
          lastUpdate.current = 0; // Force immediate update
          updateFromEvent(e);
        }}
        onMouseMove={updateFromEvent}
        onMouseLeave={() => {
          setActive(false);
          setPos({ x: 50, y: 50 });
        }}
        className={className}
        style={
          {
            // fallback base
            color: "hsl(var(--foreground) / 0.82)",
            // gradient dentro do texto
            backgroundImage: `radial-gradient(160px 90px at ${pos.x}% ${pos.y}%, hsl(var(--gold-hot) / ${
              0.9 * intensity
            }) 0%, hsl(var(--gold-soft) / ${0.55 * intensity}) 46%, hsl(var(--foreground) / 0) 78%)`,
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            transition: "filter 160ms ease, opacity 160ms ease",
            opacity: active ? 1 : 0.98,
            filter: active
              ? `drop-shadow(0 0 10px hsl(var(--gold-hot) / ${0.18 * intensity}))`
              : "none",
          } as React.CSSProperties
        }
      >
        {children}
      </span>
    );
  }
);

GoldHoverText.displayName = "GoldHoverText";

// Compat: alguns lugares podem importar como default.
export default GoldHoverText;
