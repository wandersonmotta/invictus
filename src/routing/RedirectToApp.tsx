import * as React from "react";
import { useLocation } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { buildAppUrlFromCurrentLocation } from "@/lib/appOrigin";

const LOOP_WINDOW_MS = 2000;
const LOOP_STORAGE_KEY = "invictus_redirect_to_app_last";

type LastAttempt = {
  at: number;
  path: string;
};

function readLastAttempt(): LastAttempt | null {
  try {
    const raw = sessionStorage.getItem(LOOP_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LastAttempt;
    if (!parsed || typeof parsed.at !== "number" || typeof parsed.path !== "string") return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeLastAttempt(value: LastAttempt) {
  try {
    sessionStorage.setItem(LOOP_STORAGE_KEY, JSON.stringify(value));
  } catch {
    // ignore
  }
}

/**
 * Root-domain redirect (landing-only host): sends all non-root paths to app.*.
 * Includes a safety guard to avoid infinite flicker if an external domain rule
 * forces app.* back to the root (e.g. "Primary domain" redirect).
 */
export function RedirectToApp() {
  const location = useLocation();

  const path = React.useMemo(() => {
    // include query/hash so the guard keys by the *actual* navigation intent
    return `${location.pathname}${window.location.search}${window.location.hash}`;
  }, [location.pathname]);

  const url = React.useMemo(() => buildAppUrlFromCurrentLocation(location.pathname), [location.pathname]);
  const [blockedByLoop, setBlockedByLoop] = React.useState(false);

  React.useEffect(() => {
    const now = Date.now();
    const last = readLastAttempt();
    const inLoop = !!last && last.path === path && now - last.at < LOOP_WINDOW_MS;

    if (inLoop) {
      setBlockedByLoop(true);
      return;
    }

    writeLastAttempt({ at: now, path });
    window.location.assign(url);
  }, [path, url]);

  if (!blockedByLoop) return null;

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-xl flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-balance text-lg font-semibold text-foreground">Redirecionamento bloqueado</h1>
      <p className="text-pretty text-sm text-muted-foreground">
        Detectei um loop entre o domínio raiz e o subdomínio do app. Isso normalmente acontece quando existe um
        “Primary domain” forçando redirecionamento.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Button asChild>
          <a href={url}>Abrir app</a>
        </Button>
        <Button asChild variant="outline">
          <a href="/">Voltar para a landing</a>
        </Button>
      </div>
    </main>
  );
}
