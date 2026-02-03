import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DonutWithLegend } from "./charts/DonutWithLegend";

interface RegionItem {
  name: string;
  value: number;
  color: string;
}

interface LeadsRegionDonutChartProps {
  data: RegionItem[];
  className?: string;
  isLoading?: boolean;
}

export function LeadsRegionDonutChart({
  data,
  className,
  isLoading = false,
}: LeadsRegionDonutChartProps) {
  if (isLoading) {
    return (
      <Card
        className={cn(
          "bg-card/60 backdrop-blur-sm border-border/40",
          className
        )}
      >
        <CardHeader className="pb-2">
          <div className="animate-pulse h-4 w-32 bg-muted rounded" />
        </CardHeader>
        <CardContent>
          <div className="animate-pulse flex items-center gap-6">
            <div className="w-28 h-28 bg-muted rounded-full" />
            <div className="flex-1 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-4 bg-muted rounded w-full" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "bg-card/60 backdrop-blur-sm border-border/40",
        className
      )}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Origem dos Acessos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <DonutWithLegend data={data} showProgress />
      </CardContent>
    </Card>
  );
}
