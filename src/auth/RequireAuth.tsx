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
    // While the user is pending, we want the approval to "unlock" automatically.
    // Keep polling only on the waiting screen to avoid unnecessary traffic elsewhere.
    refetchInterval: location.pathname === "/aguardando-aprovacao" ? 8_000 : false,
    queryFn: async () => {
      if (!session?.user.id)
        return {
          access_status: "pending" as const,
          first_name: null as string | null,
          last_name: null as string | null,
        };
      const { data, error } = await supabase
        .from("profiles")
        .select("access_status, first_name, last_name")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (error) throw error;
      return (data ?? {
        access_status: "pending",
        first_name: null,
        last_name: null,
      }) as {
        access_status: "pending" | "approved" | "rejected";
        first_name: string | null;
        last_name: string | null;
      };
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
  const allowedWhenIncomplete = new Set(["/perfil", "/reset-password", "/auth"]);

  const firstName = (profileQuery.data?.first_name ?? "").trim();
  const lastName = (profileQuery.data?.last_name ?? "").trim();
  const profileComplete = Boolean(firstName && lastName);

  // Obrigatório: sem Nome + Sobrenome, bloqueia navegação e força /perfil.
  if (!profileComplete && !allowedWhenIncomplete.has(path)) {
    return <Navigate to="/perfil" replace state={{ from: path }} />;
  }

  const allowedWhenPending = new Set(["/perfil", "/aguardando-aprovacao", "/reset-password", "/auth"]);

  if (status !== "approved" && !allowedWhenPending.has(path)) {
    return <Navigate to="/aguardando-aprovacao" replace state={{ from: path }} />;
  }

  // If the user gets approved while on the waiting screen, redirect automatically.
  if (status === "approved" && path === "/aguardando-aprovacao") {
    const from = (location.state as any)?.from;
    return <Navigate to={typeof from === "string" && from ? from : "/app"} replace />;
  }

  return <>{children}</>;
}
