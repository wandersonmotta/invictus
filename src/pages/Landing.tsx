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
import { HeroIntro } from "@/components/landing/HeroIntro";
import { useForceDark } from "@/hooks/useForceDark";

export default function Landing() {
  useForceDark();
  const [introComplete, setIntroComplete] = React.useState(false);

  React.useEffect(() => {
    document.body.classList.add("invictus-landing-body");
    return () => document.body.classList.remove("invictus-landing-body");
  }, []);

  return (
    <>
      <HeroIntro onComplete={() => setIntroComplete(true)} />
      <main
        className="invictus-landing-page min-h-svh"
        style={{
          opacity: introComplete ? 1 : 0,
          transition: "opacity 600ms cubic-bezier(0.2,0.8,0.2,1)",
        }}
      >
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
    </>
  );
}
