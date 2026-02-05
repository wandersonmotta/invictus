 import * as React from "react";
 import { Navigate, useLocation } from "react-router-dom";
 import { useAuth } from "@/auth/AuthProvider";
 import { isLovableHost } from "@/lib/appOrigin";
 
 /**
  * Session-only guard for financial routes.
  * Does NOT check profile status or approval - only requires a valid session.
  * Redirects to the appropriate login page based on environment.
  */
 export function RequireFinanceiroAuth({ children }: { children: React.ReactNode }) {
   const { session, loading } = useAuth();
   const location = useLocation();
 
   if (loading) {
     return (
       <div className="flex min-h-screen items-center justify-center bg-background">
         <div className="animate-pulse text-muted-foreground">Carregando...</div>
       </div>
     );
   }
 
   if (!session) {
     // Redirect to the appropriate login page based on environment
     const loginPath = isLovableHost(window.location.hostname)
       ? "/financeiro/auth"
       : "/auth";
     return <Navigate to={loginPath} replace state={{ from: location.pathname }} />;
   }
 
   return <>{children}</>;
 }