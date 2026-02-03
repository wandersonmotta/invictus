import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

interface DonutItem {
  name: string;
  value: number;
  color: string;
}

type LayoutMode = "auto" | "horizontal" | "vertical";

interface DonutWithLegendProps {
  data: DonutItem[];
  title?: string;
  className?: string;
  showProgress?: boolean;
  showPercentage?: boolean;
  height?: number;
  layout?: LayoutMode;
}

export function DonutWithLegend({
  data,
  title,
  className,
  showProgress = true,
  showPercentage = false,
  height = 112,
  layout = "auto",
}: DonutWithLegendProps) {
  const total = data.reduce((acc, item) => acc + item.value, 0);

  // For "auto" layout, we use vertical by default to prevent truncation issues
  // Horizontal layout is only used when explicitly requested
  const isVertical = layout === "vertical" || layout === "auto";
  
  // Adjust donut size based on layout
  const donutSize = isVertical ? Math.min(height, 120) : height;
  const innerRadius = isVertical ? 28 : 32;
  const outerRadius = isVertical ? 44 : 48;

  return (
    <div
      className={cn(
        "flex w-full min-w-0",
        isVertical
          ? "flex-col items-center gap-4"
          : "flex-row items-start gap-4",
        className
      )}
    >
      {/* Donut Chart */}
      <div
        className="flex-shrink-0"
        style={{ width: donutSize, height: donutSize }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={innerRadius}
              outerRadius={outerRadius}
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

      {/* Legend */}
      <div
        className={cn(
          "space-y-2",
          isVertical ? "w-full" : "flex-1 min-w-0 pt-1"
        )}
      >
        {title && (
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
            {title}
          </p>
        )}
        {data.map((item) => {
          const percentage = total > 0 ? (item.value / total) * 100 : 0;
          return (
            <div key={item.name} className="space-y-1">
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs text-muted-foreground flex-1">
                  {item.name}
                </span>
                <span className="text-xs font-medium tabular-nums flex-shrink-0">
                  {showPercentage
                    ? `${percentage.toFixed(0)}%`
                    : item.value.toLocaleString("pt-BR")}
                </span>
              </div>
              {showProgress && (
                <Progress
                  value={percentage}
                  className="h-1 bg-muted/30"
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
