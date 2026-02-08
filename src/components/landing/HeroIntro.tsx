import * as React from "react";
import logo from "@/assets/invictus-logo.png";

/**
 * Cortina de abertura cinematográfica.
 * Logo aparece centralizado com fade+scale, depois sobe e some enquanto o conteúdo aparece.
 */
export function HeroIntro({ onComplete }: { onComplete?: () => void }) {
  const [phase, setPhase] = React.useState<"logo" | "exit" | "done">("logo");

  React.useEffect(() => {
    // Respeitar reduced-motion
    const mqMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mqMotion.matches) {
      setPhase("done");
      onComplete?.();
      return;
    }

    // Phase 1: logo visível por 800ms
    const t1 = setTimeout(() => setPhase("exit"), 900);
    // Phase 2: exit animation 500ms
    const t2 = setTimeout(() => {
      setPhase("done");
      onComplete?.();
    }, 1400);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [onComplete]);

  if (phase === "done") return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{
        background: "hsl(var(--background))",
        opacity: phase === "exit" ? 0 : 1,
        transition: "opacity 500ms cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      <img
        src={logo}
        alt=""
        className="w-20 select-none sm:w-24"
        draggable={false}
        style={{
          filter: "drop-shadow(0 0 20px hsl(var(--primary) / 0.4))",
          animation: "invictus-intro-logo 900ms cubic-bezier(0.2, 0.8, 0.2, 1) both",
        }}
      />
      <span
        className="mt-3 text-xs font-semibold tracking-[0.35em] text-foreground/80"
        style={{
          animation: "invictus-intro-text 900ms cubic-bezier(0.2, 0.8, 0.2, 1) 200ms both",
        }}
      >
        FRATERNIDADE
      </span>
    </div>
  );
}
