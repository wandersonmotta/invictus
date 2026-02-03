import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { WeeklyBarChart } from "./charts/WeeklyBarChart";
import type { PlatformMetric } from "./charts/types";

interface PlatformMetricsCardProps {
  platform: "meta" | "google_ads" | "analytics";
  title: string;
  chartData: { day: string; value: number }[];
  chartLabel: string;
  metrics: PlatformMetric[];
  className?: string;
  isLoading?: boolean;
}

const platformConfig = {
  meta: {
    icon: "📘",
    legendColor: "#3B82F6",
    color: "hsl(214 100% 50%)",
    gradient: "from-blue-600/20 via-blue-500/10 to-transparent",
    borderAccent: "border-blue-500/20",
  },
  google_ads: {
    icon: "📗",
    legendColor: "#22C55E",
    color: "hsl(142 76% 36%)",
    gradient: "from-green-600/20 via-green-500/10 to-transparent",
    borderAccent: "border-green-500/20",
  },
  analytics: {
    icon: "📊",
    legendColor: "#F97316",
    color: "hsl(25 95% 53%)",
    gradient: "from-orange-600/20 via-orange-500/10 to-transparent",
    borderAccent: "border-orange-500/20",
  },
};

export function PlatformMetricsCard({
  platform,
  title,
  chartData,
  chartLabel,
  metrics,
  className,
  isLoading = false,
}: PlatformMetricsCardProps) {
  const config = platformConfig[platform];

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
          <div className="h-4 w-24 bg-muted rounded" />
          <div className="h-24 bg-muted/50 rounded" />
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-1">
                <div className="h-3 w-16 bg-muted rounded" />
                <div className="h-5 w-20 bg-muted rounded" />
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
        "bg-card/60 backdrop-blur-sm border-border/40",
        config.borderAccent,
        className
      )}
    >
      {/* Background gradient */}
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-50 pointer-events-none",
          config.gradient
        )}
      />

      <div className="relative z-10 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{config.icon}</span>
            <h3 className="font-medium text-foreground">{title}</h3>
          </div>
        </div>

        {/* Chart Label */}
        <div className="flex items-center gap-2">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: config.legendColor }}
          />
          <span className="text-xs text-muted-foreground">{chartLabel}</span>
        </div>

        {/* Weekly Chart */}
        <WeeklyBarChart data={chartData} color={config.color} height={100} />

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 pt-2 border-t border-border/30">
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
