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
        backgroundImage: `
          linear-gradient(
            135deg,
            hsl(var(--gold-hot)) 0%,
            hsl(var(--gold-soft)) 45%,
            hsl(var(--gold-hot)) 100%
          )
        `,
        backgroundClip: "text",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        position: "relative",
        display: "inline",
      }}
    >
      {/* Camada de brilho animado */}
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            linear-gradient(
              105deg,
              transparent 0%,
              transparent 35%,
              hsl(50 100% 95% / 0.7) 45%,
              hsl(45 100% 85% / 0.9) 50%,
              hsl(50 100% 95% / 0.7) 55%,
              transparent 65%,
              transparent 100%
            )
          `,
          backgroundSize: "250% 100%",
          backgroundClip: "text",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          animation: "gold-sweep 4s ease-in-out infinite",
        }}
      >
        {children}
      </span>
      {children}
      <style>{`
        @keyframes gold-sweep {
          0%   { background-position: 150% center; }
          40%  { background-position: -50% center; }
          100% { background-position: -50% center; }
        }
      `}</style>
    </span>
  );
}
