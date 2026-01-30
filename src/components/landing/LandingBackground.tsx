import * as React from "react";

/**
 * Fallback ultra-robusto para o background da landing.
 * Alguns browsers/mobile podem falhar ao renderizar `background-image` em body/containers.
 * Aqui renderizamos a imagem como um layer fixo atrás do conteúdo.
 */
export function LandingBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <picture>
        <source
          media="(min-width: 768px)"
          srcSet="/images/invictus-landing-bg-1920x1080-v2.jpg"
        />
        <img
          src="/images/invictus-landing-bg-1536x1920-v2.jpg"
          alt=""
          className="h-full w-full object-cover"
          loading="eager"
          decoding="async"
        />
      </picture>

      {/* Overlays de legibilidade usando tokens (sem cores hardcoded) */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: [
            // centro mais legível
            "radial-gradient(900px 700px at 50% 30%, hsl(var(--background) / 0.82), transparent 60%)",
            "radial-gradient(900px 700px at 50% 0%, hsl(var(--foreground) / 0.10), transparent 55%)",
            "radial-gradient(1200px 900px at 50% 120%, hsl(var(--background) / 0.92), transparent 60%)",
            // aura dourada
            "radial-gradient(900px 700px at 18% 6%, hsl(var(--primary) / 0.10), transparent 55%)",
            "radial-gradient(800px 600px at 82% 8%, hsl(var(--primary) / 0.06), transparent 55%)",
          ].join(", "),
        }}
      />
    </div>
  );
}
