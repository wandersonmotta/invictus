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
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-black"
      style={{
        willChange: "transform",
        contain: "paint layout",
      }}
    >
      {/* 
        RESTORED CINEMATIC VIDEO 
        - The user explicitly requested to restore the previous video/image if the variable texture failed.
        - Returning to the "Dark Corridor" loop which provided good depth.
      */}
      <div className="absolute inset-0 z-0">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover opacity-40 scale-105"
            style={{ filter: "grayscale(100%) contrast(1.2)" }}
          >
            <source src="https://cdn.coverr.co/videos/coverr-walking-through-a-dark-corridor-4458/1080p.mp4" type="video/mp4" />
          </video>
          
          {/* Deep Overlay to mesh video with background */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,hsl(var(--background))_100%)] opacity-80" />
      </div>

      {/* "DISCIPLINA > TALENTO" - Subtle Background Text Layer */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full text-center z-0 opacity-[0.03] select-none pointer-events-none overflow-hidden">
         <span 
            className="text-[15vw] font-black leading-none whitespace-nowrap text-foreground animate-pulse"
            style={{ 
                fontFamily: "'Oswald', sans-serif",
                textShadow: "0 0 100px rgba(0,0,0,0.5)" 
            }}
         >
             DISCIPLINA
         </span>
      </div>

      {/* Overlay cinematográfico premium com Mesh Gradients e Profundidade */}
      <div
        className="invictus-noise absolute inset-0 opacity-100 mix-blend-overlay"
        style={{
          backgroundImage: [
            "radial-gradient(100% 100% at 50% 0%, hsl(var(--background) / 0.4), transparent 70%)", // Top shadow
            "radial-gradient(120% 120% at 50% 100%, hsl(var(--background) / 0.9), transparent 60%)", // Bottom shadow
            "radial-gradient(1400px 900px at 0% 0%, hsl(var(--primary) / 0.15), transparent 45%)", // Gold focus top
            "radial-gradient(1200px 800px at 100% 100%, hsl(var(--primary) / 0.08), transparent 40%)", // Gold focus bottom
          ].join(", "),
          willChange: "transform",
          transform: "translateZ(0)",
        }}
      />
      {/* Brilho Especular (Luz batendo no metal) */}
       <div 
        className="absolute inset-0 opacity-10"
        style={{
          background: "radial-gradient(80% 50% at 50% -10%, hsl(var(--primary) / 0.3), transparent 100%)",
          mixBlendMode: "screen",
        }}
      />
    </div>
  );
}
