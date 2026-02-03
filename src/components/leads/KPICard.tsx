import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Card } from "@/components/ui/card";

interface KPICardProps {
  title: string;
  value: string;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  variant?: "default" | "primary" | "success" | "warning";
  className?: string;
}

export function KPICard({
  title,
  value,
  change,
  changeLabel,
  icon,
  variant = "default",
  className,
}: KPICardProps) {
  const isPositive = change !== undefined && change >= 0;

  return (
    <Card
      className={cn(
        "relative overflow-hidden p-4 transition-all duration-200 hover:shadow-lg",
        "bg-card/80 backdrop-blur-sm border-border/50",
        variant === "primary" && "border-primary/30 bg-gradient-to-br from-primary/5 to-transparent",
        variant === "success" && "border-green-500/30 bg-gradient-to-br from-green-500/5 to-transparent",
        variant === "warning" && "border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-transparent",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {title}
          </p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
        </div>
        {icon && (
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
        )}
      </div>

      {change !== undefined && (
        <div className="mt-3 flex items-center gap-1">
          <div
            className={cn(
              "flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded",
              isPositive
                ? "text-green-600 bg-green-500/10"
                : "text-red-600 bg-red-500/10"
            )}
          >
            {isPositive ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {isPositive ? "+" : ""}
            {change.toFixed(1)}%
          </div>
          {changeLabel && (
            <span className="text-xs text-muted-foreground">{changeLabel}</span>
          )}
        </div>
      )}

      {/* Decorative gradient */}
      <div
        className={cn(
          "absolute -right-8 -bottom-8 w-24 h-24 rounded-full opacity-10",
          variant === "default" && "bg-primary",
          variant === "primary" && "bg-primary",
          variant === "success" && "bg-green-500",
          variant === "warning" && "bg-amber-500"
        )}
      />
    </Card>
  );
}
