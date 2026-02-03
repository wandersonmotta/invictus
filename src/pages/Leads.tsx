import * as React from "react";
import { Link } from "react-router-dom";
import { DateRange } from "react-day-picker";
import { subDays } from "date-fns";
import {
  DollarSign,
  Target,
  TrendingUp,
  BarChart3,
  Settings2,
  RefreshCw,
  AlertCircle,
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
import { ExportReportDialog } from "@/components/leads/ExportReportDialog";
import {
  useLeadsMetrics,
  formatCurrency,
  formatNumber,
  formatPercent,
} from "@/hooks/useLeadsMetrics";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Leads() {
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  const { meta, googleAds, ga4, aggregated, refetchAll } =
    useLeadsMetrics(dateRange);

  const hasAnyConnection = meta.connected || googleAds.connected || ga4.connected;
  const isLoading = aggregated.isLoading;

  // Build metrics for platform cards
  const metaMetrics = React.useMemo(() => {
    if (!meta.connected || !meta.data?.metrics) {
      return [
        { label: "Investimento", value: "-", change: 0 },
        { label: "Compras", value: "-", change: 0 },
        { label: "CPC", value: "-", change: 0 },
        { label: "ROAS", value: "-", change: 0 },
      ];
    }
    const m = meta.data.metrics;
    return [
      { label: "Investimento", value: formatCurrency(m.spend), change: 0 },
      { label: "Compras", value: formatNumber(m.purchases), change: 0 },
      { label: "CPC", value: formatCurrency(m.cpc), change: 0 },
      { label: "ROAS", value: `${formatNumber(m.roas, 2)}x`, change: 0 },
    ];
  }, [meta.connected, meta.data]);

  const googleAdsMetrics = React.useMemo(() => {
    if (!googleAds.connected || !googleAds.data?.metrics) {
      return [
        { label: "Investimento", value: "-", change: 0 },
        { label: "Conversões", value: "-", change: 0 },
        { label: "CPC", value: "-", change: 0 },
        { label: "CTR", value: "-", change: 0 },
      ];
    }
    const m = googleAds.data.metrics as {
      spend: number;
      conversions: number;
      cpc: number;
      ctr: number;
    };
    return [
      { label: "Investimento", value: formatCurrency(m.spend), change: 0 },
      { label: "Conversões", value: formatNumber(m.conversions), change: 0 },
      { label: "CPC", value: formatCurrency(m.cpc), change: 0 },
      { label: "CTR", value: formatPercent(m.ctr), change: 0 },
    ];
  }, [googleAds.connected, googleAds.data]);

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
          <Button
            variant="outline"
            size="icon"
            onClick={refetchAll}
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/leads/conexoes">
              <Settings2 className="h-4 w-4 mr-2" />
              Conexões
            </Link>
          </Button>
          <ExportReportDialog
            dateRange={dateRange}
            aggregatedData={aggregated}
            metaMetrics={
              meta.connected && meta.data?.metrics
                ? {
                    spend: meta.data.metrics.spend,
                    impressions: meta.data.metrics.impressions,
                    clicks: meta.data.metrics.clicks,
                    purchases: meta.data.metrics.purchases,
                    roas: meta.data.metrics.roas,
                  }
                : undefined
            }
            googleAdsMetrics={
              googleAds.connected && googleAds.data?.metrics
                ? (googleAds.data.metrics as {
                    spend: number;
                    impressions: number;
                    clicks: number;
                    conversions: number;
                  })
                : undefined
            }
            ga4Metrics={
              ga4.connected && ga4.data?.metrics
                ? (ga4.data.metrics as {
                    sessions: number;
                    users: number;
                    pageviews: number;
                    bounceRate: number;
                  })
                : undefined
            }
          />
        </div>
      </div>

      {/* No connections alert */}
      {!isLoading && !hasAnyConnection && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Nenhuma plataforma conectada.{" "}
            <Link to="/leads/conexoes" className="underline font-medium">
              Conecte suas contas
            </Link>{" "}
            para visualizar dados reais.
          </AlertDescription>
        </Alert>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {isLoading ? (
          <>
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </>
        ) : (
          <>
            <KPICard
              title="Investimento"
              value={
                hasAnyConnection
                  ? formatCurrency(aggregated.totalSpend)
                  : "R$ 0,00"
              }
              changeLabel="total no período"
              icon={<DollarSign className="h-4 w-4" />}
              variant="primary"
            />
            <KPICard
              title="Conversões"
              value={
                hasAnyConnection
                  ? formatNumber(aggregated.totalConversions)
                  : "0"
              }
              changeLabel="total no período"
              icon={<Target className="h-4 w-4" />}
            />
            <KPICard
              title="Taxa Conv."
              value={
                hasAnyConnection
                  ? formatPercent(aggregated.conversionRate)
                  : "0%"
              }
              changeLabel="média do período"
              icon={<TrendingUp className="h-4 w-4" />}
              variant="success"
            />
            <KPICard
              title="Faturamento"
              value={
                hasAnyConnection
                  ? formatCurrency(aggregated.totalRevenue)
                  : "R$ 0,00"
              }
              changeLabel="total no período"
              icon={<BarChart3 className="h-4 w-4" />}
              variant="warning"
            />
            <KPICard
              title="ROI Geral"
              value={
                hasAnyConnection ? `${formatNumber(aggregated.roi, 2)}x` : "0x"
              }
              changeLabel="retorno sobre investimento"
              icon={<TrendingUp className="h-4 w-4" />}
            />
          </>
        )}
      </div>

      {/* Charts Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        <ImpressionsChart />
        <AnalyticsChart />
        <RegionChart />
      </div>

      {/* Platform Summary */}
      <div className="grid md:grid-cols-2 gap-4">
        <PlatformSummaryCard
          platform="meta"
          metrics={metaMetrics}
          isConnected={meta.connected}
          isLoading={meta.isLoading}
        />
        <PlatformSummaryCard
          platform="google_ads"
          metrics={googleAdsMetrics}
          isConnected={googleAds.connected}
          isLoading={googleAds.isLoading}
        />
      </div>

      {/* Footer note */}
      {!hasAnyConnection && (
        <p className="text-xs text-center text-muted-foreground pt-4">
          Conecte suas plataformas para visualizar dados reais de campanhas.
        </p>
      )}
    </div>
  );
}
