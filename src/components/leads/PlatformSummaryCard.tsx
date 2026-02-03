import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Link2Off } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface MetricRow {
  label: string;
  value: string;
  change?: number;
}

interface PlatformSummaryCardProps {
  platform: "meta" | "google_ads";
  metrics: MetricRow[];
  className?: string;
  isConnected?: boolean;
  isLoading?: boolean;
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
  isConnected = true,
  isLoading = false,
}: PlatformSummaryCardProps) {
  const style = platformStyles[platform];

  if (isLoading) {
    return (
      <Card className={cn("bg-card/80 backdrop-blur-sm border-border/50", className)}>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-24" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!isConnected) {
    return (
      <Card
        className={cn(
          "bg-card/80 backdrop-blur-sm border-border/50 overflow-hidden",
          className
        )}
      >
        <div className={cn("absolute inset-0 bg-gradient-to-br opacity-30", style.gradient)} />
        <CardHeader className="relative pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <span>{style.icon}</span>
            <span>{style.name}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="relative flex flex-col items-center justify-center py-6 gap-3">
          <Link2Off className="h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground text-center">
            Plataforma não conectada
          </p>
          <Button variant="outline" size="sm" asChild>
            <Link to="/leads/conexoes">Conectar</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

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
              {metric.change !== undefined && metric.change !== 0 && (
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
