import { Link } from "react-router-dom";

import { GoldHoverText } from "@/components/GoldHoverText";
import { getAppOrigin } from "@/lib/appOrigin";

export function LandingFooter() {
  const appAuthUrl = `${getAppOrigin()}/auth`;

  return (
    <footer className="px-4 pb-10 sm:px-6">
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex flex-col gap-4 rounded-xl border border-border/60 bg-background/30 px-5 py-6 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <div>
            <GoldHoverText className="text-xs font-semibold tracking-[0.35em]">INVICTUS • FRATERNIDADE</GoldHoverText>
            <p className="mt-1 text-xs text-muted-foreground">Disciplina em liberdade. Resultado em identidade.</p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <a href={appAuthUrl} className="text-muted-foreground underline-offset-4 hover:underline">
              Entrar
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
