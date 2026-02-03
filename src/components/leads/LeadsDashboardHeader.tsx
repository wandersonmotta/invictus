import { Link } from "react-router-dom";
import { Settings2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/leads/DateRangePicker";
import { cn } from "@/lib/utils";
import type { DateRange } from "react-day-picker";

interface LeadsDashboardHeaderProps {
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  onRefresh: () => void;
  isLoading: boolean;
  companyName?: string;
}

export function LeadsDashboardHeader({
  dateRange,
  onDateRangeChange,
  onRefresh,
  isLoading,
  companyName = "Nome da Empresa",
}: LeadsDashboardHeaderProps) {
  return (
    <div className="flex flex-col gap-3">
      {/* Top Row: Platform Logos + Date Picker */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          {/* Meta Logo */}
          <div className="flex items-center gap-1.5">
            <span className="text-[#1877F2] text-lg font-bold">∞</span>
            <span className="font-semibold text-sm text-foreground">Meta</span>
          </div>
          
          {/* Google Ads Logo */}
          <div className="flex items-center gap-1.5">
            <span className="text-emerald-500 text-lg">▲</span>
            <span className="font-semibold text-sm text-foreground">Google Ads</span>
          </div>
          
          {/* Analytics Logo */}
          <div className="flex items-center gap-1.5">
            <span className="text-orange-500 text-lg">📊</span>
            <span className="font-semibold text-sm text-foreground">Analytics</span>
          </div>
        </div>

        {/* Right side: Actions + Date picker */}
        <div className="flex items-center gap-2">
          <DateRangePicker value={dateRange} onChange={onDateRangeChange} />
          <Button
            variant="outline"
            size="icon"
            onClick={onRefresh}
            disabled={isLoading}
            className="h-9 w-9"
          >
            <RefreshCw
              className={cn("h-4 w-4", isLoading && "animate-spin")}
            />
          </Button>
          <Button variant="outline" size="sm" asChild className="hidden sm:flex">
            <Link to="/leads/conexoes">
              <Settings2 className="h-4 w-4 mr-2" />
              Conexões
            </Link>
          </Button>
          <Button variant="outline" size="icon" asChild className="sm:hidden h-9 w-9">
            <Link to="/leads/conexoes">
              <Settings2 className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Title Row - matching reference exactly */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          Relatório Geral de Marketing
        </span>
        <span className="text-muted-foreground">|</span>
        <span className="text-sm font-semibold text-foreground">{companyName}</span>
      </div>
    </div>
  );
}
