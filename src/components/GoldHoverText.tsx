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
 */
export function GoldHoverText({
  children,
  className,
  intensity = 1
}: GoldHoverTextProps) {
  const ref = React.useRef<HTMLSpanElement | null>(null);
  const [active, setActive] = React.useState(false);
  const [pos, setPos] = React.useState({
    x: 50,
    y: 50
  });
  const updateFromEvent = (e: React.MouseEvent<HTMLSpanElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width * 100;
    const y = (e.clientY - rect.top) / rect.height * 100;
    setPos({
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y))
    });
  };
  return;
}