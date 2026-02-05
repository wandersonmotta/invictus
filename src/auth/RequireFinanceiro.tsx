 import { ReactNode } from "react";
 import { Navigate } from "react-router-dom";
 import { useIsFinanceiro } from "@/hooks/useIsFinanceiro";
 
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
     return <Navigate to="/auth" replace />;
   }
 
   return <>{children}</>;
 }