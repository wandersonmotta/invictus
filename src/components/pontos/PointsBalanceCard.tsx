import { Gift, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface PointsBalanceCardProps {
  balance: number;
  redeemedCount: number;
}

export function PointsBalanceCard({ balance, redeemedCount }: PointsBalanceCardProps) {
  return (
    <div className="flex w-full rounded-2xl overflow-hidden invictus-frame">
      {/* Resgatados */}
      <div className="flex flex-1 items-center gap-3 bg-card/80 px-5 py-4">
        <Gift className="size-5 text-primary shrink-0" />
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground leading-tight">Resgatados</p>
          <p className="text-xl font-bold tracking-tight text-foreground">
            {redeemedCount.toLocaleString("pt-BR")}
          </p>
        </div>
      </div>

      {/* Meus pontos */}
      <div className="flex flex-1 items-center gap-3 bg-foreground px-5 py-4">
        <Star className="size-5 text-background/70 shrink-0" />
        <div className="min-w-0">
          <p className="text-xs text-background/60 leading-tight">Meus pontos</p>
          <p className="text-xl font-bold tracking-tight text-background">
            {balance.toLocaleString("pt-BR")}
          </p>
        </div>
      </div>
    </div>
  );
}
