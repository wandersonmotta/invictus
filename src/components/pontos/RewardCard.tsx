import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface RewardCardProps {
  reward: {
    id: string;
    name: string;
    description: string | null;
    points_cost: number;
    image_url: string | null;
  };
  balance: number;
  onRedeem: (rewardId: string) => void;
  redeeming: boolean;
}

export function RewardCard({ reward, balance, onRedeem, redeeming }: RewardCardProps) {
  const canAfford = balance >= reward.points_cost;

  return (
    <div
      className={cn(
        "invictus-surface invictus-frame flex flex-col gap-3 rounded-2xl p-4",
        "border border-border/40"
      )}
    >
      {reward.image_url && (
        <div className="aspect-[3/4] w-full overflow-hidden rounded-xl bg-muted/30">
          <img
            src={reward.image_url}
            alt={reward.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>
      )}

      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-foreground">{reward.name}</h3>
        {reward.description && (
          <p className="text-xs text-muted-foreground">{reward.description}</p>
        )}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-primary">
          {reward.points_cost.toLocaleString("pt-BR")} pts
        </span>
        <Button
          size="sm"
          disabled={!canAfford || redeeming}
          onClick={() => onRedeem(reward.id)}
        >
          {redeeming ? "Resgatando…" : "Resgatar"}
        </Button>
      </div>
    </div>
  );
}
