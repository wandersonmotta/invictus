import { Gift } from "lucide-react";
import { cn } from "@/lib/utils";

interface PointsBalanceCardProps {
  balance: number;
}

export function PointsBalanceCard({ balance }: PointsBalanceCardProps) {
  return (
    <div
      className={cn(
        "invictus-surface invictus-frame relative w-full rounded-2xl p-5",
        "bg-gradient-to-br from-card/80 to-card/60"
      )}
    >
      <Gift className="absolute right-4 top-4 size-6 text-primary/60" />
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">Seus pontos</p>
        <p className="text-3xl font-bold tracking-tight text-foreground">
          {balance.toLocaleString("pt-BR")}
        </p>
      </div>
    </div>
  );
}
