import { useQuery } from "@tanstack/react-query";
import { rpcUntyped } from "@/lib/rpc";

/**
 * Checks whether the current user holds the `financeiro` or `suporte` roles
 * (and whether they are also an admin).
 *
 * Used by route guards to redirect restricted users away from areas they
 * should not access.
 */
export function useRestrictedRole(userId: string | null | undefined) {
  return useQuery({
    queryKey: ["restricted_role_check", userId],
    enabled: !!userId,
    staleTime: 30_000,
    queryFn: async () => {
      if (!userId) return { isFinanceiro: false, isSuporte: false, isAdmin: false };

      const [fin, sup, adm] = await Promise.all([
        rpcUntyped<boolean>("has_role", { _user_id: userId, _role: "financeiro" }),
        rpcUntyped<boolean>("has_role", { _user_id: userId, _role: "suporte" }),
        rpcUntyped<boolean>("has_role", { _user_id: userId, _role: "admin" }),
      ]);

      return {
        isFinanceiro: !fin.error && fin.data === true,
        isSuporte: !sup.error && sup.data === true,
        isAdmin: !adm.error && adm.data === true,
      };
    },
  });
}
