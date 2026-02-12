import * as React from "react";

import { useRevealOnScroll } from "@/hooks/useRevealOnScroll";
import { useCursorGlow } from "@/hooks/useCursorGlow";

type SectionShellProps = {
  id?: string;
  title: string;
  children: React.ReactNode;
  level?: "h1" | "h2";
};

export function SectionShell({ id, title, children, level = "h2" }: SectionShellProps) {
  const reveal = useRevealOnScroll<HTMLElement>({
    rootMargin: "0px 0px -28% 0px",
    threshold: 0.3,
    once: true,
    enterDelayMs: 56,
    disableClasses: true,
  });

  const glowRef = useCursorGlow<HTMLDivElement>();

  const TitleTag = level;
  const titleClass = level === "h1" ? "invictus-editorial-h1" : "invictus-editorial-h2";

  return (
    <section
      id={id}
      ref={reveal.ref}
      className={
        "invictus-reveal-scope invictus-reveal px-4 py-10 sm:px-6 sm:py-14 lg:py-16 xl:py-20 " +
        (reveal.visible ? " invictus-revealed" : "")
      }
    >
      <div className="mx-auto w-full max-w-6xl invictus-section-draw">
        <header className="invictus-section-head mb-12 flex items-end justify-between gap-4">
          <div className="min-w-0 space-y-2">
            <p className="invictus-section-eyebrow !text-primary/60 tracking-[0.6em]">EST. 2024</p>
            <TitleTag className={`${titleClass} invictus-gradient-wipe text-balance invictus-mask-text`}>{title}</TitleTag>
          </div>
          <div
            className={`invictus-section-separator hidden sm:block h-px bg-primary/20 flex-1 ml-12 mb-4 ${reveal.visible ? "invictus-separator-animate" : ""}`}
            aria-hidden="true"
          />
        </header>
        <div ref={glowRef} className="invictus-landing-panel invictus-cursor-glow">{children}</div>
      </div>
    </section>
  );
}