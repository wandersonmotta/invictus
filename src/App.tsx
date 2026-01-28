import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import Home from "./pages/Home";
import Mapa from "./pages/Mapa";
import NotFound from "./pages/NotFound";
import Buscar from "./pages/Buscar";
import Mensagens from "./pages/Mensagens";
import Perfil from "./pages/Perfil";
import Admin from "./pages/Admin";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <AppLayout>
                <Home />
              </AppLayout>
            }
          />
          <Route
            path="/mapa"
            element={
              <AppLayout>
                <Mapa />
              </AppLayout>
            }
          />
          <Route
            path="/buscar"
            element={
              <AppLayout>
                <Buscar />
              </AppLayout>
            }
          />
          <Route
            path="/mensagens"
            element={
              <AppLayout>
                <Mensagens />
              </AppLayout>
            }
          />
          <Route
            path="/perfil"
            element={
              <AppLayout>
                <Perfil />
              </AppLayout>
            }
          />
          <Route
            path="/admin"
            element={
              <AppLayout>
                <Admin />
              </AppLayout>
            }
          />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
