 import { ReactNode } from "react";
 import { Navigate } from "react-router-dom";
 import { useIsFinanceiro } from "@/hooks/useIsFinanceiro";
import { isLovableHost } from "@/lib/appOrigin";
 
 interface RequireFinanceiroProps {
   children: ReactNode;
 }
 
 /**
  * Guard component that only renders children if the user has the 'financeiro' role.
  * Redirects to /auth if not authorized.
  */
 export function RequireFinanceiro({ children }: RequireFinanceiroProps) {
   const { isFinanceiro, loading } = useIsFinanceiro();
 
   if (loading) {
     return (
       <div className="flex min-h-screen items-center justify-center bg-background">
         <div className="animate-pulse text-muted-foreground">Verificando acesso...</div>
       </div>
     );
   }
 
   if (!isFinanceiro) {
    // In Lovable preview, redirect to /financeiro/auth
    // In production subdomain, redirect to /auth (root of financeiro. subdomain)
    const loginPath = isLovableHost(window.location.hostname)
      ? "/financeiro/auth"
      : "/auth";
    return <Navigate to={loginPath} replace />;
   }
 
   return <>{children}</>;
 }