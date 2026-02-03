import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface KPICardProps {
  title: string;
  value: string;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  variant?: "default" | "primary" | "success" | "warning" | "meta" | "google";
  showProgress?: boolean;
  progressValue?: number;
  className?: string;
}

const variantStyles = {
  default: {
    border: "border-border/50",
    gradient: "from-primary/10 to-transparent",
    progressColor: "hsl(var(--primary))",
    decorative: "bg-primary",
  },
  primary: {
    border: "border-primary/30",
    gradient: "from-primary/15 to-transparent",
    progressColor: "hsl(42 85% 50%)",
    decorative: "bg-primary",
  },
  success: {
    border: "border-green-500/30",
    gradient: "from-green-500/15 to-transparent",
    progressColor: "hsl(142 76% 45%)",
    decorative: "bg-green-500",
  },
  warning: {
    border: "border-amber-500/30",
    gradient: "from-amber-500/15 to-transparent",
    progressColor: "hsl(45 93% 47%)",
    decorative: "bg-amber-500",
  },
  meta: {
    border: "border-blue-500/30",
    gradient: "from-blue-500/15 to-transparent",
    progressColor: "hsl(214 100% 50%)",
    decorative: "bg-blue-500",
  },
  google: {
    border: "border-green-500/30",
    gradient: "from-green-600/15 to-transparent",
    progressColor: "hsl(142 76% 36%)",
    decorative: "bg-green-600",
  },
};

export function KPICard({
  title,
  value,
  change,
  changeLabel,
  icon,
  variant = "default",
  showProgress = false,
  progressValue = 0,
  className,
}: KPICardProps) {
  const isPositive = change !== undefined && change >= 0;
  const styles = variantStyles[variant];

  return (
    <Card
      className={cn(
        "relative overflow-hidden p-4 transition-all duration-200",
        "bg-card/60 backdrop-blur-sm",
        styles.border,
        className
      )}
    >
      {/* Background gradient */}
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-60 pointer-events-none",
          styles.gradient
        )}
      />

      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
              {title}
            </p>
            <p className="text-xl font-bold text-foreground">{value}</p>
          </div>
          {icon && (
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              {icon}
            </div>
          )}
        </div>

        {change !== undefined && (
          <div className="mt-2 flex items-center gap-1.5">
            <div
              className={cn(
                "flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded",
                isPositive
                  ? "text-green-500 bg-green-500/15"
                  : "text-red-500 bg-red-500/15"
              )}
            >
              {isPositive ? (
                <TrendingUp className="h-2.5 w-2.5" />
              ) : (
                <TrendingDown className="h-2.5 w-2.5" />
              )}
              {isPositive ? "+" : ""}
              {change.toFixed(1)}%
            </div>
            {changeLabel && (
              <span className="text-[10px] text-muted-foreground">
                {changeLabel}
              </span>
            )}
          </div>
        )}

        {/* Progress bar */}
        {showProgress && (
          <div className="mt-3">
            <Progress
              value={progressValue}
              className="h-1 bg-muted/30"
              style={
                { "--progress-color": styles.progressColor } as React.CSSProperties
              }
            />
          </div>
        )}
      </div>

      {/* Decorative gradient circle */}
      <div
        className={cn(
          "absolute -right-6 -bottom-6 w-20 h-20 rounded-full opacity-10",
          styles.decorative
        )}
      />
    </Card>
  );
}
