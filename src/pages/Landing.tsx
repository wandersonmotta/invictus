import * as React from "react";

import { LandingTopbar } from "@/components/landing/LandingTopbar";
import { WaitlistHero } from "@/components/landing/WaitlistHero";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import {
  FinalWarning,
  LeadershipAndRule,
  Manifesto,
  Pillars,
  WhatYouFindHere,
  WhoIsFor,
} from "@/components/landing/ManifestoSections";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingBackground } from "@/components/landing/LandingBackground";
import { useForceDark } from "@/hooks/useForceDark";

export default function Landing() {
  // Força tema dark na landing page, independente da escolha do usuário
  useForceDark();

  React.useEffect(() => {
    // Fallback robusto: garante o background premium mesmo se algum device
    // não aplicar corretamente o background no container principal.
    document.body.classList.add("invictus-landing-body");
    return () => document.body.classList.remove("invictus-landing-body");
  }, []);

  return (
    <main className="invictus-landing-page min-h-svh">
      <LandingBackground />
      <LandingTopbar />
      <Manifesto />
      <Pillars />
      <WhatYouFindHere />
      <WhoIsFor />
      <LeadershipAndRule />
      <FinalWarning />
      <WaitlistHero />
      <TestimonialsSection />
      <LandingFooter />
    </main>
  );
}
