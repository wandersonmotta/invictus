import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { GoldHoverText } from "@/components/GoldHoverText";
import logo from "@/assets/invictus-logo.png";

export function LandingTopbar() {
  return (
    <header className="w-full">
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
            <Link to="/auth">Entrar</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
