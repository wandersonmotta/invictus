import * as React from "react";
import { Link } from "react-router-dom";
import { DateRange } from "react-day-picker";
import { subDays } from "date-fns";
import {
  DollarSign,
  Target,
  TrendingUp,
  BarChart3,
  Download,
  Settings2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { KPICard } from "@/components/leads/KPICard";
import { DateRangePicker } from "@/components/leads/DateRangePicker";
import {
  ImpressionsChart,
  AnalyticsChart,
  RegionChart,
} from "@/components/leads/LeadsOverviewCharts";
import { PlatformSummaryCard } from "@/components/leads/PlatformSummaryCard";

// Mock KPI data
const mockKPIs = {
  investimento: { value: "R$ 10.453", change: 115 },
  conversoes: { value: "1.058,08", change: 101 },
  taxaConversao: { value: "24,89%", change: 85 },
  faturamento: { value: "R$ 28.178", change: 134 },
  roi: { value: "2.7x", change: 116 },
};

const metaMetrics = [
  { label: "Investimento", value: "R$ 9.598", change: 120 },
  { label: "Compras", value: "315", change: 98 },
  { label: "CPC", value: "R$ 30,47", change: -5 },
  { label: "ROAS", value: "2.94x", change: 15 },
];

const googleAdsMetrics = [
  { label: "Investimento", value: "R$ 854", change: 85 },
  { label: "Conversões", value: "743", change: 110 },
  { label: "CPC", value: "R$ 1,15", change: -12 },
  { label: "CTR", value: "4.2%", change: 8 },
];

export default function Leads() {
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: subDays(new Date(), 11),
    to: new Date(),
  });

  return (
    <div className="min-h-screen p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Leads</h1>
          <p className="text-sm text-muted-foreground">
            Acompanhe suas campanhas de tráfego pago
          </p>
        </div>

        <div className="flex items-center gap-3">
          <DateRangePicker value={dateRange} onChange={setDateRange} />
          <Button variant="outline" size="sm" asChild>
            <Link to="/leads/conexoes">
              <Settings2 className="h-4 w-4 mr-2" />
              Conexões
            </Link>
          </Button>
          <Button size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <KPICard
          title="Investimento"
          value={mockKPIs.investimento.value}
          change={mockKPIs.investimento.change}
          changeLabel="vs período anterior"
          icon={<DollarSign className="h-4 w-4" />}
          variant="primary"
        />
        <KPICard
          title="Conversões"
          value={mockKPIs.conversoes.value}
          change={mockKPIs.conversoes.change}
          changeLabel="vs período anterior"
          icon={<Target className="h-4 w-4" />}
        />
        <KPICard
          title="Taxa Conv."
          value={mockKPIs.taxaConversao.value}
          change={mockKPIs.taxaConversao.change}
          changeLabel="vs período anterior"
          icon={<TrendingUp className="h-4 w-4" />}
          variant="success"
        />
        <KPICard
          title="Faturamento"
          value={mockKPIs.faturamento.value}
          change={mockKPIs.faturamento.change}
          changeLabel="vs período anterior"
          icon={<BarChart3 className="h-4 w-4" />}
          variant="warning"
        />
        <KPICard
          title="ROI Geral"
          value={mockKPIs.roi.value}
          change={mockKPIs.roi.change}
          changeLabel="vs período anterior"
          icon={<TrendingUp className="h-4 w-4" />}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        <ImpressionsChart />
        <AnalyticsChart />
        <RegionChart />
      </div>

      {/* Platform Summary */}
      <div className="grid md:grid-cols-2 gap-4">
        <PlatformSummaryCard platform="meta" metrics={metaMetrics} />
        <PlatformSummaryCard platform="google_ads" metrics={googleAdsMetrics} />
      </div>

      {/* Footer note */}
      <p className="text-xs text-center text-muted-foreground pt-4">
        Dados exibidos são de demonstração. Conecte suas plataformas para ver dados reais.
      </p>
    </div>
  );
}
