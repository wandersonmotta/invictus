import * as React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
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
] as const;

function scheduleIdle(cb: () => void) {
  const w = window as any;
  if (typeof w.requestIdleCallback === "function") return w.requestIdleCallback(cb, { timeout: 2500 });
  return window.setTimeout(cb, 700);
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
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem={true}
      storageKey="invictus-theme"
      disableTransitionOnChange={false}
    >
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AuthProvider>
            <BrowserRouter>
              {/* Sem fallback visual */}
              <React.Suspense fallback={null}>
                <HostRouter />
              </React.Suspense>
            </BrowserRouter>
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
