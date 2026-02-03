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
            <span className="text-lg font-bold" style={{ color: "#1877F2" }}>∞</span>
            <span className="font-semibold text-sm text-foreground">Meta</span>
          </div>
          
          {/* Google Ads Logo */}
          <div className="flex items-center gap-1.5">
            <svg viewBox="0 0 24 24" className="h-4 w-4">
              <path fill="#FBBC04" d="M3.5 18.49l5.5-9.53 5.5 9.53a3 3 0 0 1-1.1 4.1 3 3 0 0 1-4.1-1.1L3.5 18.49Z"/>
              <path fill="#4285F4" d="M14.5 18.49l5.5-9.53a3 3 0 0 1 4.1 1.1 3 3 0 0 1-1.1 4.1l-5.5 3.18-3-1.85Z"/>
              <path fill="#34A853" d="M9 8.96l5.5-9.53a3 3 0 0 1 4.1 1.1l-5.5 9.53L9 8.96Z"/>
              <circle fill="#EA4335" cx="6" cy="18" r="3"/>
            </svg>
            <span className="font-semibold text-sm text-foreground">Google Ads</span>
          </div>
          
          {/* Analytics Logo */}
          <div className="flex items-center gap-1.5">
            <svg viewBox="0 0 24 24" className="h-4 w-4">
              <path fill="#F9AB00" d="M22 12c0 5.52-4.48 10-10 10S2 17.52 2 12h4c0 3.31 2.69 6 6 6s6-2.69 6-6h4Z"/>
              <path fill="#E37400" d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12h4c0-3.31 2.69-6 6-6s6 2.69 6 6h4Z"/>
              <circle fill="#F9AB00" cx="12" cy="12" r="4"/>
            </svg>
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
