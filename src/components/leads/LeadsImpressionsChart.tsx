import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DualLineChart } from "./charts/DualLineChart";

interface LeadsImpressionsChartProps {
  data: { date: string; meta: number; google: number }[];
  totalValue: number;
  change?: number;
  className?: string;
  isLoading?: boolean;
}

export function LeadsImpressionsChart({
  data,
  totalValue,
  change,
  className,
  isLoading = false,
}: LeadsImpressionsChartProps) {
  const isPositive = change !== undefined && change >= 0;

  if (isLoading) {
    return (
      <Card
        className={cn(
          "bg-card/60 backdrop-blur-sm border-border/40",
          className
        )}
      >
        <CardHeader className="pb-2">
          <div className="animate-pulse space-y-2">
            <div className="h-4 w-32 bg-muted rounded" />
            <div className="h-7 w-24 bg-muted rounded" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse h-[220px] bg-muted/30 rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "bg-card/60 backdrop-blur-sm border-border/40",
        className
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">
            Impressões Totais
          </p>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[hsl(214_100%_50%)]" />
              <span className="text-muted-foreground">Meta Ads</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[hsl(142_76%_36%)]" />
              <span className="text-muted-foreground">Google Ads</span>
            </div>
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-foreground">
            {totalValue.toLocaleString("pt-BR")}
          </span>
          {change !== undefined && (
            <span
              className={cn(
                "flex items-center text-xs font-medium",
                isPositive ? "text-green-500" : "text-red-500"
              )}
            >
              {isPositive ? (
                <TrendingUp className="h-3 w-3 mr-0.5" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-0.5" />
              )}
              {isPositive ? "+" : ""}
              {change.toFixed(1)}%
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <DualLineChart data={data} height={220} />
      </CardContent>
    </Card>
  );
}
