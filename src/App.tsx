import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { AuthProvider } from "@/auth/AuthProvider";
import { RequireAuth } from "@/auth/RequireAuth";
import Home from "./pages/Home";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Buscar from "./pages/Buscar";
import Mensagens from "./pages/Mensagens";
import Perfil from "./pages/Perfil";
import Admin from "./pages/Admin";
import AuthPage from "./pages/Auth";
import ClassPage from "./pages/Class";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route
              path="/"
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
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
