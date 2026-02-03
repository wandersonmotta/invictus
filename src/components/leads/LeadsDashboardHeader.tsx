import { Link } from "react-router-dom";
import { Settings2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/leads/DateRangePicker";
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
  companyName = "Dashboard",
}: LeadsDashboardHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      {/* Left: Platform Icons + Company Name */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="text-xl" title="Meta Ads">📘</span>
          <span className="text-xl" title="Google Ads">📗</span>
          <span className="text-xl" title="Google Analytics">📊</span>
        </div>
        <div className="h-6 w-px bg-border/50" />
        <h1 className="text-xl font-bold text-foreground">{companyName}</h1>
      </div>

      {/* Right: Controls */}
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
            className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
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
  );
}
