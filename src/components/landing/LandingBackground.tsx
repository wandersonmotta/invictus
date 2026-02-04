/**
 * FONTE ÚNICA do background da landing - otimizado para performance.
 * Páginas públicas são SEMPRE dark — não consulta o tema do sistema.
 */
export function LandingBackground() {
  // Hardcoded: páginas públicas sempre usam o tema dark cinematográfico
  const isDark = true;

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
      <picture>
        <source
          media="(min-width: 768px)"
          srcSet="/images/invictus-landing-bg-1920x1080-v2.jpg"
          type="image/jpeg"
        />
        <img
          src="/images/invictus-landing-bg-1536x1920-v2.jpg"
          alt=""
          className="h-full w-full object-cover transition-opacity duration-500"
          loading="eager"
          decoding="sync"
          fetchPriority="high"
          style={{
            willChange: "transform",
            transform: "translateZ(0)",
            // Light: imagem mais clara; Dark: full intensity
            opacity: isDark ? 1 : 0.35,
          }}
        />
      </picture>

      {/* Overlay adaptativo por tema */}
      <div
        className="absolute inset-0 transition-all duration-500"
        style={{
          backgroundImage: isDark
            ? [
                // DARK: overlay existente (cinematográfico)
                "radial-gradient(1000px 700px at 50% 30%, hsl(var(--background) / 0.75), transparent 55%)",
                "radial-gradient(1400px 800px at 50% 110%, hsl(var(--background) / 0.85), transparent 50%)",
                "radial-gradient(800px 500px at 25% 5%, hsl(var(--primary) / 0.08), transparent 50%)",
              ].join(", ")
            : [
                // LIGHT: overlay perolado sofisticado
                "linear-gradient(180deg, hsl(40 10% 96% / 0.88) 0%, hsl(40 10% 96% / 0.82) 100%)",
                "radial-gradient(1000px 700px at 50% 30%, hsl(40 10% 96% / 0.65), transparent 55%)",
                "radial-gradient(800px 500px at 25% 5%, hsl(42 85% 50% / 0.05), transparent 50%)",
              ].join(", "),
          willChange: "transform",
          transform: "translateZ(0)",
        }}
      />
    </div>
  );
}
