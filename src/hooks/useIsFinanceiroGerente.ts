import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Server-validated financeiro_gerente flag.
 */
export function useIsFinanceiroGerente(userId: string | null | undefined) {
  return useQuery({
    queryKey: ["is_financeiro_gerente", userId],
    enabled: !!userId,
    staleTime: 30_000,
    queryFn: async () => {
      if (!userId) return false;
      const { data, error } = await supabase.rpc("has_role", {
        _user_id: userId,
        _role: "financeiro_gerente",
      });
      if (error) throw error;
      return Boolean(data);
    },
  });
}
