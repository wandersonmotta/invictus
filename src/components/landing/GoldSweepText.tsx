import * as React from "react";

/**
 * Texto com animação automática de brilho dourado varrendo da esquerda para a direita,
 * como um reflexo de luz passando por uma superfície metálica premium.
 */
export function GoldSweepText({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={`gold-sweep-text ${className ?? ""}`}>
      {children}
    </span>
  );
}
