import * as React from "react";
import { cn } from "@/lib/utils";

type LoopVideoProps = {
  src: string;
  poster?: string;
  className?: string;
  /** Acessibilidade (se omitido, o vídeo vira decorativo/aria-hidden) */
  ariaLabel?: string;
};

function usePrefersReducedMotion() {
  const [reduced, setReduced] = React.useState(false);

  React.useEffect(() => {
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!mq) return;
    const onChange = () => setReduced(!!mq.matches);
    onChange();
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  return reduced;
}

/**
 * Vídeo em loop estilo "GIF" (mp4), com autoplay muted (compatível com mobile).
 * Se prefers-reduced-motion estiver ativo, não dá autoplay.
 */
export function LoopVideo({ src, poster, className, ariaLabel }: LoopVideoProps) {
  const reduced = usePrefersReducedMotion();

  return (
    <video
      className={cn("h-full w-full object-cover", className)}
      src={src}
      poster={poster}
      autoPlay={!reduced}
      muted
      loop
      playsInline
      preload="metadata"
      aria-label={ariaLabel}
      aria-hidden={ariaLabel ? undefined : true}
    />
  );
}
