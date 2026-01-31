import * as React from "react";
import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "@/auth/AuthProvider";
import { useIsAdmin } from "@/hooks/useIsAdmin";

export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();
  const isAdminQuery = useIsAdmin(user?.id);

  if (isAdminQuery.isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="text-sm text-muted-foreground">Carregando…</div>
      </div>
    );
  }

  if (isAdminQuery.isError || !isAdminQuery.data) {
    return <Navigate to="/app" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
