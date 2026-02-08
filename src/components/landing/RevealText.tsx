import * as React from "react";
import { useRevealOnScroll } from "@/hooks/useRevealOnScroll";

/**
 * Revela texto linha a linha com delay escalonado.
 * Cada filho direto aparece com um leve delay.
 */
export function RevealText({
  children,
  className = "",
  delayMs = 80,
}: {
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
}) {
  const reveal = useRevealOnScroll<HTMLDivElement>({
    rootMargin: "0px 0px -10% 0px",
    threshold: 0.15,
    once: true,
    enterDelayMs: 40,
    disableClasses: true,
  });

  return (
    <div ref={reveal.ref} className={className}>
      {React.Children.map(children, (child, i) => (
        <div
          style={{
            opacity: reveal.visible ? 1 : 0,
            transform: reveal.visible ? "none" : "translateY(8px)",
            transition: `opacity 500ms cubic-bezier(0.2,0.8,0.2,1) ${i * delayMs}ms, transform 500ms cubic-bezier(0.2,0.8,0.2,1) ${i * delayMs}ms`,
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}
