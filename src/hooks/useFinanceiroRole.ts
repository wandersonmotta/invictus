import { useAuth } from "@/auth/AuthProvider";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useIsFinanceiroGerente } from "@/hooks/useIsFinanceiroGerente";

export type FinanceiroRole = "admin" | "gerente" | "auditor";

/**
 * Returns the effective role of the current user in the financeiro context.
 * - admin / financeiro_gerente → full access
 * - financeiro (without gerente) → auditor (audit queue only)
 */
export function useFinanceiroRole() {
  const { user } = useAuth();
  const { data: isAdmin, isLoading: loadingAdmin } = useIsAdmin(user?.id);
  const { data: isGerente, isLoading: loadingGerente } = useIsFinanceiroGerente(user?.id);

  const loading = loadingAdmin || loadingGerente;

  let role: FinanceiroRole = "auditor";
  if (isAdmin) role = "admin";
  else if (isGerente) role = "gerente";

  const isManager = role === "admin" || role === "gerente";

  return { role, isManager, loading };
}
