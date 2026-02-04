import * as React from "react";

import { useRevealOnScroll } from "@/hooks/useRevealOnScroll";

type SectionShellProps = {
  id?: string;
  title: string;
  children: React.ReactNode;
};

export function SectionShell({ id, title, children }: SectionShellProps) {
  const reveal = useRevealOnScroll<HTMLElement>({
    // Desktop: viewport maior = precisamos “segurar” o reveal um pouco
    rootMargin: "0px 0px -18% 0px",
    threshold: 0.22,
    once: true,
    enterDelayMs: 56,
    disableClasses: true,
  });

  return (
    <section
      id={id}
      ref={reveal.ref}
      className={
        "invictus-reveal-scope invictus-reveal px-4 py-10 sm:px-6 sm:py-14 lg:py-16 xl:py-20 " +
        (reveal.visible ? " invictus-revealed" : "")
      }
    >
      <div className="mx-auto w-full max-w-6xl">
        <header className="invictus-section-head mb-6 flex items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="invictus-section-eyebrow">INVICTUS</p>
            <h2 className="invictus-landing-title text-balance text-2xl font-semibold sm:text-3xl">{title}</h2>
          </div>
          <div className="invictus-section-separator hidden sm:block" aria-hidden="true" />
        </header>
        <div className="invictus-landing-panel">{children}</div>
      </div>
    </section>
  );
}
