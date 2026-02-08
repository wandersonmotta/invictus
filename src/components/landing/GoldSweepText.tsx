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
    <span
      className={className}
      style={{
        display: "inline",
        backgroundImage: `
          linear-gradient(
            135deg,
            hsl(var(--gold-hot)) 0%,
            hsl(var(--gold-soft)) 45%,
            hsl(var(--gold-hot)) 100%
          ),
          linear-gradient(
            105deg,
            transparent 0%,
            transparent 30%,
            hsl(50 100% 95% / 0.7) 42%,
            hsl(45 100% 85% / 0.9) 50%,
            hsl(50 100% 95% / 0.7) 58%,
            transparent 70%,
            transparent 100%
          )
        `,
        backgroundSize: "100% 100%, 250% 100%",
        backgroundClip: "text",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        animation: "gold-sweep 3s ease-in-out infinite",
      }}
    >
      {children}
      <style>{`
        @keyframes gold-sweep {
          0%   { background-position: 0% center, 200% center; }
          60%  { background-position: 0% center, -100% center; }
          100% { background-position: 0% center, -100% center; }
        }
      `}</style>
    </span>
  );
}
