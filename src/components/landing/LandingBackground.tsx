import * as React from "react";

/**
 * FONTE ÚNICA do background da landing - otimizado para performance.
 * 
 * Estratégia:
 * - Imagem com fetchPriority="high" para prioridade máxima
 * - will-change: transform promove layer na GPU (evita descarregamento)
 * - Overlay simplificado (3 gradientes vs 5+) para menos recomposição
 * - Sem animação contínua para reduzir trabalho do browser
 */
export function LandingBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      style={{
        willChange: "transform",
        transform: "translateZ(0)", // força GPU layer
        contain: "paint layout", // otimização de rendering
      }}
    >
      <picture>
        <source
          media="(min-width: 768px)"
          srcSet="/images/invictus-landing-bg-1920x1080-v2.jpg"
          type="image/jpeg"
        />
        <img
          src="/images/invictus-landing-bg-1536x1920-v2.jpg"
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
      </picture>

      {/* Overlay simplificado: 3 gradientes essenciais (vs 5+) */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: [
            // vinheta central para legibilidade
            "radial-gradient(1000px 700px at 50% 30%, hsl(var(--background) / 0.75), transparent 55%)",
            // sombra inferior suave
            "radial-gradient(1400px 800px at 50% 110%, hsl(var(--background) / 0.85), transparent 50%)",
            // aura dourada sutil (única)
            "radial-gradient(800px 500px at 25% 5%, hsl(var(--primary) / 0.08), transparent 50%)",
          ].join(", "),
          // GPU layer para evitar recomposição
          willChange: "transform",
          transform: "translateZ(0)",
        }}
      />
    </div>
  );
}
