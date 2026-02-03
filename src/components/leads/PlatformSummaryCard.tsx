import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

interface MetricRow {
  label: string;
  value: string;
  change?: number;
}

interface PlatformSummaryCardProps {
  platform: "meta" | "google_ads";
  metrics: MetricRow[];
  className?: string;
}

const platformStyles = {
  meta: {
    name: "Meta Ads",
    icon: "📘",
    gradient: "from-blue-600/20 to-blue-400/5",
    accent: "text-blue-500",
  },
  google_ads: {
    name: "Google Ads",
    icon: "📗",
    gradient: "from-green-600/20 to-green-400/5",
    accent: "text-green-500",
  },
};

export function PlatformSummaryCard({
  platform,
  metrics,
  className,
}: PlatformSummaryCardProps) {
  const style = platformStyles[platform];

  return (
    <Card
      className={cn(
        "bg-card/80 backdrop-blur-sm border-border/50 overflow-hidden",
        className
      )}
    >
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-50", style.gradient)} />
      <CardHeader className="relative pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <span>{style.icon}</span>
          <span>{style.name}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="relative space-y-3">
        {metrics.map((metric, i) => (
          <div key={i} className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{metric.label}</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">{metric.value}</span>
              {metric.change !== undefined && (
                <div
                  className={cn(
                    "flex items-center text-[10px] font-medium",
                    metric.change >= 0 ? "text-green-500" : "text-red-500"
                  )}
                >
                  <TrendingUp className="h-3 w-3 mr-0.5" />
                  {metric.change >= 0 ? "+" : ""}
                  {metric.change}%
                </div>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
