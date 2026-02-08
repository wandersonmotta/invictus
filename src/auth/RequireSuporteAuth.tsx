import * as React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/auth/AuthProvider";
import { isLovableHost } from "@/lib/appOrigin";

export function RequireSuporteAuth({ children }: { children: React.ReactNode }) {
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
    const loginPath = isLovableHost(window.location.hostname)
      ? "/suporte-backoffice/auth"
      : "/auth";
    return <Navigate to={loginPath} replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
