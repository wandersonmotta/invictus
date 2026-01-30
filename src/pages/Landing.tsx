import * as React from "react";
import { useNavigate } from "react-router-dom";

import { LandingTopbar } from "@/components/landing/LandingTopbar";
import { WaitlistHero } from "@/components/landing/WaitlistHero";
import {
  FinalWarning,
  LeadershipAndRule,
  Manifesto,
  Pillars,
  WhatYouFindHere,
  WhoIsFor,
} from "@/components/landing/ManifestoSections";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { useAuth } from "@/auth/AuthProvider";

export default function Landing() {
  const { session } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (session) navigate("/app", { replace: true });
  }, [session, navigate]);

  return (
    <main className="invictus-auth-page min-h-svh">
      <LandingTopbar />
      <WaitlistHero />
      <Manifesto />
      <Pillars />
      <WhatYouFindHere />
      <WhoIsFor />
      <LeadershipAndRule />
      <FinalWarning />
      <LandingFooter />
    </main>
  );
}
