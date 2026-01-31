import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

/**
 * Server-validated admin flag (never rely on client-side state/localStorage).
 */
export function useIsAdmin(userId: string | null | undefined) {
  return useQuery({
    queryKey: ["is_admin", userId],
    enabled: !!userId,
    staleTime: 30_000,
    queryFn: async () => {
      if (!userId) return false;
      const { data, error } = await supabase.rpc("has_role", {
        _user_id: userId,
        _role: "admin",
      });
      if (error) throw error;
      return Boolean(data);
    },
  });
}
