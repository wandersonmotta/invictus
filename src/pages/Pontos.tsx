import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useAuth } from "@/auth/AuthProvider";
import { rpcUntyped } from "@/lib/rpc";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { PointsBalanceCard } from "@/components/pontos/PointsBalanceCard";
import { RewardCard } from "@/components/pontos/RewardCard";
import { RedeemConfirmDialog } from "@/components/pontos/RedeemConfirmDialog";

interface Reward {
  id: string;
  name: string;
  description: string | null;
  points_cost: number;
  image_url: string | null;
}

export default function Pontos() {
  const { user } = useAuth();
  const qc = useQueryClient();

  // Points balance
  const { data: balance = 0, isLoading: balanceLoading } = useQuery({
    queryKey: ["my_points", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await rpcUntyped<number>("get_my_points");
      if (error) throw error;
      return data ?? 0;
    },
  });

  // Redeemed count
  const { data: redeemedCount = 0 } = useQuery({
    queryKey: ["my_redeemed_count", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { count, error } = await (supabase as any)
        .from("point_redemptions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user!.id);
      if (error) throw error;
      return count ?? 0;
    },
  });

  // Rewards catalog
  const { data: rewards = [], isLoading: rewardsLoading } = useQuery({
    queryKey: ["point_rewards"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("point_rewards")
        .select("id, name, description, points_cost, image_url")
        .eq("active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Reward[];
    },
  });

  // Redeem flow
  const [redeemTarget, setRedeemTarget] = useState<Reward | null>(null);
  const [redeeming, setRedeeming] = useState(false);

  const handleRedeem = useCallback(
    async () => {
      if (!redeemTarget) return;
      setRedeeming(true);
      try {
        const { error } = await rpcUntyped("redeem_reward", { p_reward_id: redeemTarget.id });
        if (error) throw error;
        toast.success("Prêmio resgatado!", {
          description: `Seu pedido de "${redeemTarget.name}" foi enviado para análise.`,
        });
        setRedeemTarget(null);
        await qc.invalidateQueries({ queryKey: ["my_points"] });
      } catch (e: any) {
        const msg = e?.message ?? String(e);
        toast.error("Erro ao resgatar", { description: msg.includes("Insufficient") ? "Pontos insuficientes." : msg });
      } finally {
        setRedeeming(false);
      }
    },
    [redeemTarget, qc],
  );

  const loading = balanceLoading || rewardsLoading;

  return (
    <main className="invictus-page mx-auto w-full max-w-5xl px-4 py-6 pb-24 sm:px-6">
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-28 w-full rounded-2xl" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Skeleton className="h-72 w-full rounded-2xl" />
            <Skeleton className="h-72 w-full rounded-2xl" />
            <Skeleton className="h-72 w-full rounded-2xl" />
          </div>
        </div>
      ) : (
        <>
          <PointsBalanceCard balance={balance} redeemedCount={redeemedCount} />

          <section className="mt-6">
            {rewards.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum prêmio disponível no momento.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {rewards.map((r) => (
                <RewardCard
                  key={r.id}
                  reward={r}
                  balance={balance}
                  onRedeem={() => setRedeemTarget(r)}
                  redeeming={redeeming && redeemTarget?.id === r.id}
                />
              ))}
              </div>
            )}
          </section>
        </>
      )}

      <RedeemConfirmDialog
        open={!!redeemTarget}
        rewardName={redeemTarget?.name ?? ""}
        pointsCost={redeemTarget?.points_cost ?? 0}
        onConfirm={() => void handleRedeem()}
        onCancel={() => setRedeemTarget(null)}
      />
    </main>
  );
}
