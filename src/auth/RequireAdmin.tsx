import * as React from "react";
import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "@/auth/AuthProvider";
import { useIsAdmin } from "@/hooks/useIsAdmin";

export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();
  const isAdminQuery = useIsAdmin(user?.id);

  // If a non-authenticated user somehow reaches here, send them to auth.
  // (Normally /admin is already wrapped by <RequireAuth />.)
  if (!user) {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  }

  if (isAdminQuery.isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="text-sm text-muted-foreground">Carregando…</div>
      </div>
    );
  }

  if (isAdminQuery.isError || !isAdminQuery.data) {
    // Logged-in non-admins: send them back to their own page.
    return <Navigate to="/perfil" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
