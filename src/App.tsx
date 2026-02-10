import * as React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, useLocation } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/auth/AuthProvider";
import { HostRouter } from "@/routing/HostRouter";

const queryClient = new QueryClient();

const preloaders = [
  () => import("./pages/Home"),
  () => import("./pages/Index"),
  () => import("./pages/NotFound"),
  () => import("./pages/Buscar"),
  () => import("./pages/Mensagens"),
  () => import("./pages/Perfil"),
  () => import("./pages/Admin"),
  () => import("./pages/Class"),
  () => import("./pages/AguardandoAprovacao"),
  () => import("./pages/Comunidade"),
  () => import("./pages/Feed"),
  () => import("./pages/Membro"),
  () => import("./pages/Leads"),
  () => import("./pages/LeadsConexoes"),
  () => import("./pages/Carteira"),
  () => import("./pages/Reconhecimento"),
  () => import("./pages/PagamentoSucesso"),
  () => import("./pages/Pagamentos"),
] as const;

function scheduleIdle(cb: () => void) {
  const w = window as any;
  // Aumentar o delay inicial para garantir que a hidratação e assets críticos tenham prioridade
  if (typeof w.requestIdleCallback === "function") return w.requestIdleCallback(cb, { timeout: 4000 });
  return window.setTimeout(cb, 2000);
}

function ThemeScopeProvider({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();

  // Rotas públicas devem ser SEMPRE dark (identidade da marca)
  const isPublicRoute =
    pathname === "/" ||
    pathname === "/auth" ||
    pathname === "/reset-password" ||
    pathname === "/aguardando-aprovacao";

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem={true}
      storageKey="invictus-theme"
      disableTransitionOnChange={false}
      // Trava o tema nas páginas públicas sem alterar a preferência salva do usuário
      forcedTheme={isPublicRoute ? "dark" : undefined}
    >
      {children}
    </ThemeProvider>
  );
}

function App() {
  // Pré-carrega rotas em idle para evitar qualquer fallback visual durante navegação,
  // mantendo a landing mais leve no primeiro paint.
  React.useEffect(() => {
    const id = scheduleIdle(() => {
      for (const p of preloaders) p();
    });
    return () => {
      const w = window as any;
      if (typeof w.cancelIdleCallback === "function") w.cancelIdleCallback(id);
      else window.clearTimeout(id);
    };
  }, []);

  return (
    <BrowserRouter>
      <ThemeScopeProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <AuthProvider>
              {/* Sem fallback visual */}
              <React.Suspense fallback={null}>
                <HostRouter />
              </React.Suspense>
            </AuthProvider>
          </TooltipProvider>
        </QueryClientProvider>
      </ThemeScopeProvider>
    </BrowserRouter>
  );
}

export default App;
