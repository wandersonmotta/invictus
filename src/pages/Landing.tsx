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
import { HeroSection } from "@/components/landing/HeroSection";
import { HeroIntro } from "@/components/landing/HeroIntro";
import { ScrollProgress } from "@/components/landing/ScrollProgress";
import { useForceDark } from "@/hooks/useForceDark";
import { useCopyProtection } from "@/hooks/useCopyProtection";

export default function Landing() {
  useForceDark();
  useCopyProtection();

  const [introComplete, setIntroComplete] = React.useState(false); // Start false to show intro

  React.useEffect(() => {
    document.body.classList.add("invictus-landing-body");
    return () => document.body.classList.remove("invictus-landing-body");
  }, []);

  return (
    <>
      {!introComplete && (
        <HeroIntro onComplete={() => setIntroComplete(true)} />
      )}
      
      {/* 
        Main content starts hidden and fades in 
        Wait for intro to complete before removing 'hidden' or standard opacity fade 
      */}
      <main 
        className={`invictus-landing-page min-h-svh w-full overflow-x-hidden transition-opacity duration-1000 ${introComplete ? 'opacity-100' : 'opacity-0'}`}
      >

        <LandingBackground />
        <LandingTopbar />
        <HeroSection />
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
