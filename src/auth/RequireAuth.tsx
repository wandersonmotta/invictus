import * as React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useRestrictedRole } from "@/hooks/useRestrictedRole";
import { isLovableHost, getFinanceiroOrigin, getSuporteOrigin } from "@/lib/appOrigin";

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
          avatar_url: null as string | null,
          bio: null as string | null,
          expertises: [] as string[],
          postal_code: null as string | null,
        };
      const { data, error } = await supabase
        .from("profiles")
        .select("access_status, first_name, last_name, avatar_url, bio, expertises, postal_code")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (error) throw error;
      return (data ?? {
        access_status: "pending",
        first_name: null,
        last_name: null,
        avatar_url: null,
        bio: null,
        expertises: [],
        postal_code: null,
      }) as {
        access_status: "pending" | "approved" | "rejected";
        first_name: string | null;
        last_name: string | null;
        avatar_url: string | null;
        bio: string | null;
        expertises: string[];
        postal_code: string | null;
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

  // --- Block restricted-role users from the member app ---
  const roleQuery = useRestrictedRole(session?.user.id);

  if (roleQuery.isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="text-sm text-muted-foreground">Carregando…</div>
      </div>
    );
  }

  if (roleQuery.data) {
    const { isFinanceiro, isSuporte, isAdmin } = roleQuery.data;

    // Financeiro-only user → redirect to financeiro area
    if (isFinanceiro && !isAdmin) {
      if (isLovableHost(window.location.hostname)) {
        return <Navigate to="/financeiro/dashboard" replace />;
      }
      window.location.href = `${getFinanceiroOrigin()}/dashboard`;
      return null;
    }

    // Suporte-only user → redirect to suporte area
    if (isSuporte && !isAdmin) {
      if (isLovableHost(window.location.hostname)) {
        return <Navigate to="/suporte-backoffice/dashboard" replace />;
      }
      window.location.href = `${getSuporteOrigin()}/dashboard`;
      return null;
    }
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
  const avatarUrl = profileQuery.data?.avatar_url ?? null;
  const bio = (profileQuery.data?.bio ?? "").trim();
  const expertises = profileQuery.data?.expertises ?? [];
  const postalCode = (profileQuery.data?.postal_code ?? "").replace(/\D/g, "");

  // For approved users, only name is mandatory
  // For pending users, all fields are mandatory
  const isApproved = status === "approved";
  const basicProfileComplete = Boolean(firstName && lastName);
  const fullProfileComplete =
    basicProfileComplete &&
    Boolean(avatarUrl) &&
    Boolean(bio) &&
    expertises.length > 0 &&
    postalCode.length === 8;

  const profileComplete = isApproved ? basicProfileComplete : fullProfileComplete;

  // Obrigatório: sem campos obrigatórios, bloqueia navegação e força /perfil.
  if (!profileComplete && !allowedWhenIncomplete.has(path)) {
    return <Navigate to="/perfil" replace state={{ from: path }} />;
  }

  const allowedWhenPending = new Set(["/perfil", "/aguardando-aprovacao", "/reset-password", "/auth"]);

  // If pending and profile is complete, redirect to waiting screen
  if (status !== "approved" && profileComplete && path !== "/aguardando-aprovacao" && !allowedWhenPending.has(path)) {
    return <Navigate to="/aguardando-aprovacao" replace state={{ from: path }} />;
  }

  // If pending but profile incomplete, allow staying on /perfil
  if (status !== "approved" && !profileComplete && path !== "/perfil" && !allowedWhenIncomplete.has(path)) {
    return <Navigate to="/perfil" replace state={{ from: path }} />;
  }

  // If pending with complete profile, only allow /aguardando-aprovacao (not /perfil for editing)
  if (status !== "approved" && profileComplete && path === "/perfil") {
    return <Navigate to="/aguardando-aprovacao" replace />;
  }

  // If the user gets approved while on the waiting screen, redirect automatically.
  if (status === "approved" && path === "/aguardando-aprovacao") {
    const from = (location.state as any)?.from;
    return <Navigate to={typeof from === "string" && from ? from : "/app"} replace />;
  }

  return <>{children}</>;
}
