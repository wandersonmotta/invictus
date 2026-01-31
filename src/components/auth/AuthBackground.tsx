import * as React from "react";

/**
 * Background otimizado para as páginas de autenticação.
 * Usa <img> com fetchPriority="high" ao invés de background-image CSS
 * para garantir carregamento prioritário.
 */
export function AuthBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      style={{
        willChange: "transform",
        transform: "translateZ(0)",
        contain: "paint layout",
      }}
    >
      <img
        src="/images/invictus-auth-bg.jpg"
        alt=""
        className="h-full w-full object-cover"
        loading="eager"
        decoding="sync"
        fetchPriority="high"
        style={{
          willChange: "transform",
          transform: "translateZ(0)",
        }}
      />

      {/* Overlay com gradientes para legibilidade */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: [
            // vinheta para legibilidade do card
            "radial-gradient(900px 700px at 50% 0%, hsl(var(--foreground) / 0.10), transparent 55%)",
            // sombra inferior
            "radial-gradient(1200px 900px at 50% 120%, hsl(var(--background) / 0.92), transparent 60%)",
            // auras douradas sutis
            "radial-gradient(900px 700px at 18% 6%, hsl(var(--primary) / 0.10), transparent 55%)",
            "radial-gradient(800px 600px at 82% 8%, hsl(var(--primary) / 0.06), transparent 55%)",
          ].join(", "),
          willChange: "transform",
          transform: "translateZ(0)",
        }}
      />
    </div>
  );
}
