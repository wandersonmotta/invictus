import { cn } from "@/lib/utils";

interface FunnelStep {
  label: string;
  value: number;
  rate?: number;
  rateLabel?: string;
}

interface FunnelChartProps {
  steps: FunnelStep[];
  className?: string;
}

export function FunnelChart({ steps, className }: FunnelChartProps) {
  const formatValue = (value: number) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K`;
    }
    return value.toLocaleString("pt-BR");
  };

  // Calculate widths - top is widest, bottom is narrowest
  const widths = [100, 85, 65, 50];

  // Collect rates for mobile display
  const rates = steps.filter((s) => s.rate !== undefined);

  return (
    <div className={cn("relative flex flex-col items-center gap-0 py-2", className)}>
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        const widthPercent = widths[index] || 50;
        const nextWidth = widths[index + 1] || widthPercent - 15;
        
        // Calculate trapezoid clip path
        const topLeftX = ((100 - widthPercent) / 2).toFixed(1);
        const topRightX = (100 - (100 - widthPercent) / 2).toFixed(1);
        const bottomLeftX = ((100 - nextWidth) / 2).toFixed(1);
        const bottomRightX = (100 - (100 - nextWidth) / 2).toFixed(1);
        
        // Blue gradient colors from light to dark
        const blueShades = [
          { from: "hsl(214 80% 60%)", to: "hsl(214 80% 52%)" },
          { from: "hsl(214 80% 52%)", to: "hsl(214 80% 44%)" },
          { from: "hsl(214 80% 44%)", to: "hsl(214 80% 36%)" },
          { from: "hsl(214 80% 36%)", to: "hsl(214 80% 28%)" },
        ];
        
        const shades = blueShades[index] || blueShades[3];

        return (
          <div key={step.label} className="relative w-full flex items-stretch">
            {/* Funnel segment */}
            <div className="flex-1 flex justify-center">
              <div
                className="relative flex flex-col items-center justify-center py-4 transition-all"
                style={{
                  width: `${widthPercent}%`,
                  minHeight: "60px",
                  background: `linear-gradient(180deg, ${shades.from} 0%, ${shades.to} 100%)`,
                  clipPath: isLast 
                    ? `polygon(${topLeftX}% 0%, ${topRightX}% 0%, ${Number(bottomRightX) - 5}% 100%, ${Number(bottomLeftX) + 5}% 100%)`
                    : `polygon(${topLeftX}% 0%, ${topRightX}% 0%, ${bottomRightX}% 100%, ${bottomLeftX}% 100%)`,
                  borderRadius: isLast ? "0 0 8px 8px" : "0",
                }}
              >
                <p className="text-[11px] text-blue-100/90 font-medium">{step.label}</p>
                <p className="text-lg font-bold text-white">
                  {formatValue(step.value)}
                </p>
              </div>
            </div>
            
            {/* Rate indicators on the right - hidden on mobile */}
            {step.rate !== undefined && (
              <div className="absolute right-0 top-1/2 -translate-y-1/2 pl-4 text-right w-28 hidden md:block">
                <p className="text-[9px] text-muted-foreground whitespace-nowrap leading-tight">
                  {step.rateLabel}
                </p>
                <p className="text-xs font-semibold text-foreground">
                  {step.rate.toFixed(2)}%
                </p>
              </div>
            )}
          </div>
        );
      })}

      {/* Mobile rate indicators - shown below funnel */}
      {rates.length > 0 && (
        <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-border/30 w-full md:hidden">
          {rates.map((step, i) => (
            <div key={i} className="text-center">
              <p className="text-[9px] text-muted-foreground">{step.rateLabel}</p>
              <p className="text-xs font-semibold text-foreground">{step.rate?.toFixed(2)}%</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
