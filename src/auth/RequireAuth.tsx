import * as React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const location = useLocation();

  const profileQuery = useQuery({
    queryKey: ["profile_access", session?.user.id],
    enabled: !!session?.user.id,
    queryFn: async () => {
      if (!session?.user.id) return { access_status: "pending" as const };
      const { data, error } = await supabase
        .from("profiles")
        .select("access_status")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (error) throw error;
      return (data ?? { access_status: "pending" }) as { access_status: "pending" | "approved" | "rejected" };
    },
    staleTime: 10_000,
  });

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="text-sm text-muted-foreground">Carregando…</div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  }

  if (profileQuery.isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="text-sm text-muted-foreground">Carregando…</div>
      </div>
    );
  }

  if (profileQuery.isError) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="text-sm font-medium text-foreground">Não foi possível carregar seu acesso</div>
          <div className="mt-1 text-xs text-muted-foreground">
            Recarregue a página. Se persistir, tente sair e entrar novamente.
          </div>
        </div>
      </div>
    );
  }

  const status = profileQuery.data?.access_status ?? "pending";
  const path = location.pathname;
  const allowedWhenPending = new Set(["/perfil", "/aguardando-aprovacao", "/reset-password", "/auth"]);

  if (status !== "approved" && !allowedWhenPending.has(path)) {
    return <Navigate to="/aguardando-aprovacao" replace state={{ from: path }} />;
  }

  return <>{children}</>;
}
