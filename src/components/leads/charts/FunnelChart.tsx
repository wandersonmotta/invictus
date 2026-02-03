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
  const maxValue = Math.max(...steps.map((s) => s.value));

  return (
    <div className={cn("flex flex-col items-center gap-0", className)}>
      {steps.map((step, index) => {
        const widthPercent = 40 + ((maxValue - step.value) / maxValue) * -35 + (index * 15);
        const isLast = index === steps.length - 1;
        
        return (
          <div key={step.label} className="relative w-full flex flex-col items-center">
            {/* Funnel segment */}
            <div
              className="relative flex items-center justify-center py-3 transition-all"
              style={{
                width: `${100 - index * 15}%`,
                background: `linear-gradient(180deg, 
                  hsl(214 80% ${55 - index * 8}%) 0%, 
                  hsl(214 80% ${45 - index * 8}%) 100%)`,
                clipPath: isLast 
                  ? "polygon(5% 0%, 95% 0%, 90% 100%, 10% 100%)"
                  : "polygon(0% 0%, 100% 0%, 95% 100%, 5% 100%)",
                borderRadius: isLast ? "0 0 8px 8px" : "0",
              }}
            >
              <div className="text-center">
                <p className="text-xs text-blue-100/80">{step.label}</p>
                <p className="text-lg font-bold text-white">
                  {step.value >= 1000 
                    ? `${(step.value / 1000).toFixed(0)}K` 
                    : step.value.toLocaleString("pt-BR")}
                </p>
              </div>
            </div>
            
            {/* Rate indicators on the right */}
            {step.rate !== undefined && (
              <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full pl-3 text-right">
                <p className="text-[10px] text-muted-foreground whitespace-nowrap">
                  {step.rateLabel}
                </p>
                <p className="text-sm font-semibold text-foreground">
                  {step.rate.toFixed(2)}%
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
