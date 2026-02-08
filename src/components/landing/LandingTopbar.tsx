import * as React from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { GoldHoverText } from "@/components/GoldHoverText";
import logo from "@/assets/invictus-logo.png";
import { getAppOrigin } from "@/lib/appOrigin";

export function LandingTopbar() {
  const appAuthUrl = `${getAppOrigin()}/auth`;
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className="sticky top-0 z-40 w-full transition-all duration-300"
      style={{
        backdropFilter: scrolled ? "blur(20px) saturate(140%)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(20px) saturate(140%)" : "none",
        background: scrolled ? "hsl(var(--background) / 0.6)" : "transparent",
        borderBottom: scrolled
          ? "1px solid hsl(var(--border) / 0.4)"
          : "1px solid transparent",
      }}
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-5 sm:px-6">
        <Link to="/" className="flex items-center gap-3" aria-label="Invictus">
          <div className="flex flex-col items-center gap-1">
            <img
              src={logo}
              alt="Logo da Invictus"
              className="h-10 w-auto select-none"
              draggable={false}
              style={{ filter: "drop-shadow(0 0 10px hsl(var(--primary) / 0.25))" }}
            />
            <GoldHoverText className="text-[10px] font-semibold tracking-[0.35em]">FRATERNIDADE</GoldHoverText>
          </div>
        </Link>

        <nav className="flex items-center gap-2">
          <Button asChild variant="outline" className="invictus-cta invictus-cta--outline h-10">
            <a href={appAuthUrl}>Entrar</a>
          </Button>
        </nav>
      </div>
    </header>
  );
}
