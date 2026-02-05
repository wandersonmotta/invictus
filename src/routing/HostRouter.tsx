import * as React from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { isAppHost as isAppHostFn, isLovableHost, isFinanceiroHost as isFinanceiroHostFn } from "@/lib/appOrigin";

import { RedirectToApp } from "@/routing/RedirectToApp";

import Landing from "@/pages/Landing";
import AuthPage from "@/pages/Auth";
import ResetPasswordPage from "@/pages/ResetPassword";
import { AppLayout } from "@/components/AppLayout";
import { RequireAuth } from "@/auth/RequireAuth";
import { RequireAdmin } from "@/auth/RequireAdmin";
import { RequireFinanceiro } from "@/auth/RequireFinanceiro";
 import { RequireFinanceiroAuth } from "@/auth/RequireFinanceiroAuth";
import { FinanceiroLayout } from "@/components/financeiro/FinanceiroLayout";

const Home = React.lazy(() => import("@/pages/Home"));
const Index = React.lazy(() => import("@/pages/Index"));
const NotFound = React.lazy(() => import("@/pages/NotFound"));
const Buscar = React.lazy(() => import("@/pages/Buscar"));
const Mensagens = React.lazy(() => import("@/pages/Mensagens"));
const Perfil = React.lazy(() => import("@/pages/Perfil"));
const Admin = React.lazy(() => import("@/pages/Admin"));
const ClassPage = React.lazy(() => import("@/pages/Class"));
const AguardandoAprovacao = React.lazy(() => import("@/pages/AguardandoAprovacao"));
const Comunidade = React.lazy(() => import("@/pages/Comunidade"));
const Feed = React.lazy(() => import("@/pages/Feed"));
const Membro = React.lazy(() => import("@/pages/Membro"));
const Leads = React.lazy(() => import("@/pages/Leads"));
const LeadsConexoes = React.lazy(() => import("@/pages/LeadsConexoes"));
 const Carteira = React.lazy(() => import("@/pages/Carteira"));
const Reconhecimento = React.lazy(() => import("@/pages/Reconhecimento"));

// Financeiro pages
const FinanceiroAuth = React.lazy(() => import("@/pages/financeiro/FinanceiroAuth"));
const FinanceiroDashboard = React.lazy(() => import("@/pages/financeiro/FinanceiroDashboard"));
const AuditoriaDetalhe = React.lazy(() => import("@/pages/financeiro/AuditoriaDetalhe"));
 const FinanceiroHistorico = React.lazy(() => import("@/pages/financeiro/FinanceiroHistorico"));
 const FinanceiroRelatorios = React.lazy(() => import("@/pages/financeiro/FinanceiroRelatorios"));

export function HostRouter() {
  const hostname = window.location.hostname;
  const isAppHost = isAppHostFn(hostname);
  const isFinanceiroHost = isFinanceiroHostFn(hostname);
  const lovable = isLovableHost(hostname);

  // In *.lovable.app (preview/staging/published default domains) we DO NOT split by subdomain,
  // otherwise /auth and any non-root route would loop forever.
  if (lovable) {
    return (
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        
        {/* Financeiro routes for preview/staging */}
        <Route path="/financeiro" element={<Navigate to="/financeiro/dashboard" replace />} />
        <Route path="/financeiro/auth" element={<FinanceiroAuth />} />
        <Route
          path="/financeiro/dashboard"
          element={
           <RequireFinanceiroAuth>
              <RequireFinanceiro>
                <FinanceiroLayout>
                  <FinanceiroDashboard />
                </FinanceiroLayout>
              </RequireFinanceiro>
           </RequireFinanceiroAuth>
          }
        />
        <Route
          path="/financeiro/auditoria/:withdrawalId"
          element={
           <RequireFinanceiroAuth>
              <RequireFinanceiro>
                <FinanceiroLayout>
                  <AuditoriaDetalhe />
                </FinanceiroLayout>
              </RequireFinanceiro>
           </RequireFinanceiroAuth>
          }
        />
       <Route
         path="/financeiro/historico"
         element={
           <RequireFinanceiroAuth>
             <RequireFinanceiro>
               <FinanceiroLayout>
                 <FinanceiroHistorico />
               </FinanceiroLayout>
             </RequireFinanceiro>
           </RequireFinanceiroAuth>
         }
       />
       <Route
         path="/financeiro/relatorios"
         element={
           <RequireFinanceiroAuth>
             <RequireFinanceiro>
               <FinanceiroLayout>
                 <FinanceiroRelatorios />
               </FinanceiroLayout>
             </RequireFinanceiro>
           </RequireFinanceiroAuth>
         }
       />

        <Route
          path="/aguardando-aprovacao"
          element={
            <RequireAuth>
              <AguardandoAprovacao />
            </RequireAuth>
          }
        />

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
          path="/leads"
          element={
            <RequireAuth>
              <AppLayout>
                <Leads />
              </AppLayout>
            </RequireAuth>
          }
        />
        <Route
          path="/leads/conexoes"
          element={
            <RequireAuth>
              <AppLayout>
                <LeadsConexoes />
              </AppLayout>
            </RequireAuth>
          }
        />
         <Route
           path="/carteira"
           element={
             <RequireAuth>
               <AppLayout>
                 <Carteira />
               </AppLayout>
             </RequireAuth>
           }
         />
        <Route
          path="/reconhecimento"
          element={
            <RequireAuth>
              <AppLayout>
                <Reconhecimento />
              </AppLayout>
            </RequireAuth>
          }
        />
        <Route
          path="/admin"
          element={
            <RequireAuth>
              <RequireAdmin>
                <AppLayout>
                  <Admin />
                </AppLayout>
              </RequireAdmin>
            </RequireAuth>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Routes>
    );
  }

  // Root domain: only Landing. Anything else -> app subdomain (preserving path).
  if (!isAppHost && !isFinanceiroHost) {
    return (
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="*" element={<RedirectToApp />} />
      </Routes>
    );
  }

  // Financeiro subdomain: isolated back office for financial team
  if (isFinanceiroHost) {
    return (
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/auth" element={<FinanceiroAuth />} />
        <Route
          path="/dashboard"
          element={
           <RequireFinanceiroAuth>
              <RequireFinanceiro>
                <FinanceiroLayout>
                  <FinanceiroDashboard />
                </FinanceiroLayout>
              </RequireFinanceiro>
           </RequireFinanceiroAuth>
          }
        />
        <Route
          path="/auditoria/:withdrawalId"
          element={
           <RequireFinanceiroAuth>
              <RequireFinanceiro>
                <FinanceiroLayout>
                  <AuditoriaDetalhe />
                </FinanceiroLayout>
              </RequireFinanceiro>
           </RequireFinanceiroAuth>
          }
        />
       <Route
         path="/historico"
         element={
           <RequireFinanceiroAuth>
             <RequireFinanceiro>
               <FinanceiroLayout>
                 <FinanceiroHistorico />
               </FinanceiroLayout>
             </RequireFinanceiro>
           </RequireFinanceiroAuth>
         }
       />
       <Route
         path="/relatorios"
         element={
           <RequireFinanceiroAuth>
             <RequireFinanceiro>
               <FinanceiroLayout>
                 <FinanceiroRelatorios />
               </FinanceiroLayout>
             </RequireFinanceiro>
           </RequireFinanceiroAuth>
         }
       />
        <Route path="*" element={<NotFound />} />
      </Routes>
    );
  }

  // App subdomain: no landing. Root path -> /app.
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/app" replace />} />

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
        path="/leads"
        element={
          <RequireAuth>
            <AppLayout>
              <Leads />
            </AppLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/leads/conexoes"
        element={
          <RequireAuth>
            <AppLayout>
              <LeadsConexoes />
            </AppLayout>
          </RequireAuth>
        }
      />
         <Route
           path="/carteira"
           element={
             <RequireAuth>
               <AppLayout>
                 <Carteira />
               </AppLayout>
             </RequireAuth>
           }
           />
        <Route
          path="/reconhecimento"
          element={
            <RequireAuth>
              <AppLayout>
                <Reconhecimento />
              </AppLayout>
            </RequireAuth>
          }
        />
      <Route
        path="/admin"
        element={
          <RequireAuth>
            <RequireAdmin>
              <AppLayout>
                <Admin />
              </AppLayout>
            </RequireAdmin>
          </RequireAuth>
        }
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
