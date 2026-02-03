import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { WeeklyBarChart } from "./charts/WeeklyBarChart";
import type { PlatformMetric } from "./charts/types";

interface LeadsAnalyticsCardProps {
  chartData: { day: string; value: number }[];
  metrics: PlatformMetric[];
  className?: string;
  isLoading?: boolean;
}

const ANALYTICS_COLOR = "hsl(25 95% 53%)";

export function LeadsAnalyticsCard({
  chartData,
  metrics,
  className,
  isLoading = false,
}: LeadsAnalyticsCardProps) {
  if (isLoading) {
    return (
      <Card
        className={cn(
          "relative overflow-hidden p-4",
          "bg-card/60 backdrop-blur-sm border-border/40",
          className
        )}
      >
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-32 bg-muted rounded" />
          <div className="h-24 bg-muted/50 rounded" />
          <div className="grid grid-cols-3 gap-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-1">
                <div className="h-3 w-16 bg-muted rounded" />
                <div className="h-5 w-14 bg-muted rounded" />
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "relative overflow-hidden p-4",
        "bg-card/60 backdrop-blur-sm border-border/40 border-orange-500/20",
        className
      )}
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-600/20 via-orange-500/10 to-transparent opacity-50 pointer-events-none" />

      <div className="relative z-10 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          <span className="text-lg">📊</span>
          <h3 className="font-medium text-foreground">Google Analytics</h3>
        </div>

        {/* Chart Label */}
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded"
            style={{ backgroundColor: ANALYTICS_COLOR }}
          />
          <span className="text-xs text-muted-foreground">
            Acessos na Semana
          </span>
        </div>

        {/* Weekly Chart */}
        <WeeklyBarChart data={chartData} color={ANALYTICS_COLOR} height={100} />

        {/* Metrics Row */}
        <div className="grid grid-cols-3 gap-4 pt-2 border-t border-border/30">
          {metrics.map((metric, i) => (
            <div key={i} className="space-y-0.5">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide">
                {metric.label}
              </p>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-foreground">
                  {metric.value}
                </span>
                {metric.change !== undefined && metric.change !== 0 && (
                  <span
                    className={cn(
                      "flex items-center text-[10px] font-medium",
                      metric.change >= 0 ? "text-green-500" : "text-red-500"
                    )}
                  >
                    {metric.change >= 0 ? (
                      <TrendingUp className="h-2.5 w-2.5 mr-0.5" />
                    ) : (
                      <TrendingDown className="h-2.5 w-2.5 mr-0.5" />
                    )}
                    {Math.abs(metric.change).toFixed(1)}%
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
