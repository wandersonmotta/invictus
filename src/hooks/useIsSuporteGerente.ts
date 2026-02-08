import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Server-validated suporte_gerente flag.
 */
export function useIsSuporteGerente(userId: string | null | undefined) {
  return useQuery({
    queryKey: ["is_suporte_gerente", userId],
    enabled: !!userId,
    staleTime: 30_000,
    queryFn: async () => {
      if (!userId) return false;
      const { data, error } = await supabase.rpc("has_role", {
        _user_id: userId,
        _role: "suporte_gerente",
      });
      if (error) throw error;
      return Boolean(data);
    },
  });
}
