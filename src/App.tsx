import * as React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { AuthProvider } from "@/auth/AuthProvider";
import { RequireAuth } from "@/auth/RequireAuth";
import Landing from "./pages/Landing";
import AuthPage from "./pages/Auth";
import ResetPasswordPage from "./pages/ResetPassword";

const Home = React.lazy(() => import("./pages/Home"));
const Index = React.lazy(() => import("./pages/Index"));
const NotFound = React.lazy(() => import("./pages/NotFound"));
const Buscar = React.lazy(() => import("./pages/Buscar"));
const Mensagens = React.lazy(() => import("./pages/Mensagens"));
const Perfil = React.lazy(() => import("./pages/Perfil"));
const Admin = React.lazy(() => import("./pages/Admin"));
const ClassPage = React.lazy(() => import("./pages/Class"));
const AguardandoAprovacao = React.lazy(() => import("./pages/AguardandoAprovacao"));
const Comunidade = React.lazy(() => import("./pages/Comunidade"));
const Feed = React.lazy(() => import("./pages/Feed"));
const Membro = React.lazy(() => import("./pages/Membro"));

function RouteFallback() {
  return (
    <div className="flex min-h-svh items-center justify-center px-6 text-sm text-muted-foreground">
      Carregando...
    </div>
  );
}

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <React.Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route
                path="/aguardando-aprovacao"
                element={
                  <RequireAuth>
                    <AguardandoAprovacao />
                  </RequireAuth>
                }
              />
              <Route path="/" element={<Landing />} />

              <Route
                path="/app"
                element={
                  <RequireAuth>
                    <AppLayout>
                      <Home />
                    </AppLayout>
                  </RequireAuth>
                }
              />
              <Route
                path="/mapa"
                element={
                  <RequireAuth>
                    <AppLayout>
                      <Index />
                    </AppLayout>
                  </RequireAuth>
                }
              />

              <Route
                path="/feed"
                element={
                  <RequireAuth>
                    <AppLayout>
                      <Feed />
                    </AppLayout>
                  </RequireAuth>
                }
              />

              <Route
                path="/membro/:username"
                element={
                  <RequireAuth>
                    <AppLayout>
                      <Membro />
                    </AppLayout>
                  </RequireAuth>
                }
              />
              <Route
                path="/buscar"
                element={
                  <RequireAuth>
                    <AppLayout>
                      <Buscar />
                    </AppLayout>
                  </RequireAuth>
                }
              />
              <Route
                path="/mensagens"
                element={
                  <RequireAuth>
                    <AppLayout>
                      <Mensagens />
                    </AppLayout>
                  </RequireAuth>
                }
              />
              <Route
                path="/mensagens/:conversationId"
                element={
                  <RequireAuth>
                    <AppLayout>
                      <Mensagens />
                    </AppLayout>
                  </RequireAuth>
                }
              />

              <Route
                path="/comunidade"
                element={
                  <RequireAuth>
                    <AppLayout>
                      <Comunidade />
                    </AppLayout>
                  </RequireAuth>
                }
              />
              <Route
                path="/comunidade/:threadId"
                element={
                  <RequireAuth>
                    <AppLayout>
                      <Comunidade />
                    </AppLayout>
                  </RequireAuth>
                }
              />
              <Route
                path="/perfil"
                element={
                  <RequireAuth>
                    <AppLayout>
                      <Perfil />
                    </AppLayout>
                  </RequireAuth>
                }
              />
              <Route
                path="/class"
                element={
                  <RequireAuth>
                    <AppLayout>
                      <ClassPage />
                    </AppLayout>
                  </RequireAuth>
                }
              />
              <Route
                path="/admin"
                element={
                  <RequireAuth>
                    <AppLayout>
                      <Admin />
                    </AppLayout>
                  </RequireAuth>
                }
              />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </React.Suspense>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
