import { useParallax } from "@/hooks/useParallax";

/**
 * FONTE ÚNICA do background da landing - otimizado para performance.
 * Páginas públicas são SEMPRE dark — não consulta o tema do sistema.
 */
export function LandingBackground() {
  const parallaxRef = useParallax<HTMLDivElement>(0.15);

  return (
    <div
      ref={parallaxRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      style={{
        willChange: "transform",
        contain: "paint layout",
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

      {/* Overlay cinematográfico */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: [
            "radial-gradient(1000px 700px at 50% 30%, hsl(var(--background) / 0.75), transparent 55%)",
            "radial-gradient(1400px 800px at 50% 110%, hsl(var(--background) / 0.85), transparent 50%)",
            "radial-gradient(800px 500px at 25% 5%, hsl(var(--primary) / 0.08), transparent 50%)",
          ].join(", "),
          willChange: "transform",
          transform: "translateZ(0)",
        }}
      />
    </div>
  );
}
