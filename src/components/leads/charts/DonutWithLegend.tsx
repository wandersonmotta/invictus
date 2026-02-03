import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

interface DonutItem {
  name: string;
  value: number;
  color: string;
}

interface DonutWithLegendProps {
  data: DonutItem[];
  title?: string;
  className?: string;
  showProgress?: boolean;
  showPercentage?: boolean;
  height?: number;
}

export function DonutWithLegend({
  data,
  title,
  className,
  showProgress = true,
  showPercentage = false,
  height = 112,
}: DonutWithLegendProps) {
  const total = data.reduce((acc, item) => acc + item.value, 0);

  return (
    <div className={cn("flex items-center gap-6", className)}>
      {/* Donut Chart */}
      <div className="flex-shrink-0" style={{ width: height, height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={32}
              outerRadius={48}
              paddingAngle={2}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend with Progress Bars */}
      <div className="flex-1 space-y-2.5">
        {title && (
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
            {title}
          </p>
        )}
        {data.map((item) => {
          const percentage = total > 0 ? (item.value / total) * 100 : 0;
          return (
            <div key={item.name} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-muted-foreground truncate">
                    {item.name}
                  </span>
                </div>
                <span className="font-medium tabular-nums">
                  {showPercentage 
                    ? `${percentage.toFixed(0)}%` 
                    : item.value.toLocaleString("pt-BR")}
                </span>
              </div>
              {showProgress && (
                <Progress
                  value={percentage}
                  className="h-1.5 bg-muted/30"
                  style={
                    {
                      "--progress-color": item.color,
                    } as React.CSSProperties
                  }
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
