import { GoldHoverText } from "@/components/GoldHoverText";
import { useRevealOnScroll } from "@/hooks/useRevealOnScroll";

export function LandingFooter() {
  const reveal = useRevealOnScroll<HTMLElement>({
    rootMargin: "0px 0px -10% 0px",
    threshold: 0.2,
    once: true,
    enterDelayMs: 40,
    disableClasses: true,
  });

  return (
    <footer
      ref={reveal.ref}
      className="px-4 pb-10 sm:px-6"
    >
      <div className="mx-auto w-full max-w-6xl">
        {/* Linha dourada que "acende" */}
        <div
          className="mx-auto mb-6 h-px w-full max-w-xs"
          style={{
            background: "linear-gradient(90deg, transparent, hsl(var(--gold-hot) / 0.6), hsl(var(--gold-soft) / 0.3), transparent)",
            transform: reveal.visible ? "scaleX(1)" : "scaleX(0)",
            transformOrigin: "center",
            transition: "transform 800ms cubic-bezier(0.2, 0.8, 0.2, 1)",
          }}
          aria-hidden
        />
        <div
          className="flex flex-col gap-4 rounded-xl border border-border/60 bg-background/30 px-5 py-6 backdrop-blur sm:flex-row sm:items-center sm:justify-between"
          style={{
            opacity: reveal.visible ? 1 : 0,
            transform: reveal.visible ? "none" : "translateY(10px)",
            transition: "opacity 600ms cubic-bezier(0.2,0.8,0.2,1) 300ms, transform 600ms cubic-bezier(0.2,0.8,0.2,1) 300ms",
          }}
        >
          <div>
            <GoldHoverText className="text-xs font-semibold tracking-[0.35em]">INVICTUS • FRATERNIDADE</GoldHoverText>
            <p className="mt-1 text-xs text-muted-foreground">Disciplina em liberdade. Resultado em identidade.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
