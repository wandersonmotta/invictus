import * as React from "react";
import { Link } from "react-router-dom";
import { DateRange } from "react-day-picker";
import { DollarSign, Target, TrendingUp, BarChart3, AlertCircle } from "lucide-react";

import { KPICard } from "@/components/leads/KPICard";
import { LeadsImpressionsChart } from "@/components/leads/LeadsImpressionsChart";
import { LeadsRegionDonutChart } from "@/components/leads/LeadsRegionDonutChart";
import { PlatformMetricsCard } from "@/components/leads/PlatformMetricsCard";
import { LeadsAnalyticsCard } from "@/components/leads/LeadsAnalyticsCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatCurrency, formatNumber, formatPercent } from "@/hooks/useLeadsMetrics";

interface LeadsOverviewViewProps {
  meta: any;
  googleAds: any;
  ga4: any;
  aggregated: any;
  isLoading: boolean;
  hasAnyConnection: boolean;
}

// Mock data for charts
const mockImpressionsData = [
  { date: "01/01", meta: 32000, google: 28000 },
  { date: "02/01", meta: 35000, google: 30000 },
  { date: "03/01", meta: 38000, google: 33000 },
  { date: "04/01", meta: 42000, google: 35000 },
  { date: "05/01", meta: 45000, google: 38000 },
  { date: "06/01", meta: 48000, google: 40000 },
  { date: "07/01", meta: 52000, google: 42000 },
  { date: "08/01", meta: 55000, google: 45000 },
  { date: "09/01", meta: 51000, google: 43000 },
  { date: "10/01", meta: 54000, google: 46000 },
];

const mockWeeklyMeta = [
  { day: "Seg", value: 180 },
  { day: "Ter", value: 220 },
  { day: "Qua", value: 210 },
  { day: "Qui", value: 290 },
  { day: "Sex", value: 340 },
  { day: "Sáb", value: 180 },
  { day: "Dom", value: 150 },
];

const mockWeeklyGoogle = [
  { day: "Seg", value: 150 },
  { day: "Ter", value: 180 },
  { day: "Qua", value: 220 },
  { day: "Qui", value: 240 },
  { day: "Sex", value: 280 },
  { day: "Sáb", value: 160 },
  { day: "Dom", value: 120 },
];

const mockWeeklyAnalytics = [
  { day: "Seg", value: 580 },
  { day: "Ter", value: 620 },
  { day: "Qua", value: 710 },
  { day: "Qui", value: 690 },
  { day: "Sex", value: 780 },
  { day: "Sáb", value: 650 },
  { day: "Dom", value: 591 },
];

const mockRegionData = [
  { name: "SP", value: 1908, color: "hsl(var(--primary))" },
  { name: "RJ", value: 277, color: "hsl(42 85% 50%)" },
  { name: "MG", value: 246, color: "hsl(142 76% 36%)" },
  { name: "PR", value: 189, color: "hsl(214 100% 50%)" },
  { name: "Outros", value: 2001, color: "hsl(var(--muted-foreground))" },
];

export function LeadsOverviewView({
  meta,
  googleAds,
  ga4,
  aggregated,
  isLoading,
  hasAnyConnection,
}: LeadsOverviewViewProps) {
  // Build metrics for platform cards
  const metaCardMetrics = React.useMemo(() => {
    if (!meta.connected || !meta.data?.metrics) {
      return [
        { label: "Investimento", value: "-" },
        { label: "Compras", value: "-" },
        { label: "CPC", value: "-" },
        { label: "ROAS", value: "-" },
      ];
    }
    const m = meta.data.metrics;
    return [
      { label: "Investimento", value: formatCurrency(m.spend), change: 12.5 },
      { label: "Compras", value: formatNumber(m.purchases), change: 8.3 },
      { label: "CPC", value: formatCurrency(m.cpc), change: -5.2 },
      { label: "ROAS", value: `${formatNumber(m.roas, 2)}x`, change: 15.0 },
    ];
  }, [meta.connected, meta.data]);

  const googleAdsCardMetrics = React.useMemo(() => {
    if (!googleAds.connected || !googleAds.data?.metrics) {
      return [
        { label: "Investimento", value: "-" },
        { label: "Conversões", value: "-" },
        { label: "CPC", value: "-" },
        { label: "CTR", value: "-" },
      ];
    }
    const m = googleAds.data.metrics as any;
    return [
      { label: "Investimento", value: formatCurrency(m.spend), change: 10.0 },
      { label: "Conversões", value: formatNumber(m.conversions), change: 6.7 },
      { label: "CPC", value: formatCurrency(m.cpc), change: -3.1 },
      { label: "CTR", value: formatPercent(m.ctr), change: 2.4 },
    ];
  }, [googleAds.connected, googleAds.data]);

  const analyticsCardMetrics = React.useMemo(() => {
    if (!ga4.connected || !ga4.data?.metrics) {
      return [
        { label: "Total Acessos", value: "-" },
        { label: "Usuários", value: "-" },
        { label: "Únicos", value: "-" },
      ];
    }
    const m = ga4.data.metrics as any;
    return [
      { label: "Total Acessos", value: formatNumber(m.sessions), change: 8.5 },
      { label: "Usuários", value: formatNumber(m.users), change: 5.2 },
      { label: "Únicos", value: formatNumber(m.pageviews), change: 12.1 },
    ];
  }, [ga4.connected, ga4.data]);

  return (
    <div className="space-y-6">
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

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {isLoading ? (
          <>
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-[100px] rounded-lg" />
            ))}
          </>
        ) : (
          <>
            <KPICard
              title="Investimento Total"
              value={hasAnyConnection ? formatCurrency(aggregated.totalSpend) : "R$ 10.453,14"}
              change={115.3}
              icon={<DollarSign className="h-4 w-4" />}
              variant="primary"
              showProgress
              progressValue={75}
            />
            <KPICard
              title="Conversões Totais"
              value={hasAnyConnection ? formatNumber(aggregated.totalConversions) : "1.058,08"}
              change={101.0}
              icon={<Target className="h-4 w-4" />}
              variant="success"
              showProgress
              progressValue={60}
            />
            <KPICard
              title="Taxa de Conversão"
              value={hasAnyConnection ? formatPercent(aggregated.conversionRate) : "24.89%"}
              change={85.3}
              icon={<TrendingUp className="h-4 w-4" />}
              showProgress
              progressValue={45}
            />
            <KPICard
              title="Faturamento Total"
              value={hasAnyConnection ? formatCurrency(aggregated.totalRevenue) : "R$ 28.178,74"}
              change={134.8}
              icon={<BarChart3 className="h-4 w-4" />}
              variant="warning"
              showProgress
              progressValue={82}
            />
            <KPICard
              title="ROI Geral"
              value={hasAnyConnection ? `${formatNumber(aggregated.roi, 2)}` : "2.7"}
              change={116.5}
              icon={<TrendingUp className="h-4 w-4" />}
              variant="success"
              showProgress
              progressValue={68}
            />
          </>
        )}
      </div>

      {/* Impressions Chart */}
      <LeadsImpressionsChart
        data={mockImpressionsData}
        totalValue={hasAnyConnection ? 380580 : 380580}
        change={111.0}
        isLoading={isLoading}
      />

      {/* Platform Cards Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        <PlatformMetricsCard
          platform="meta"
          title="Meta Ads"
          chartData={mockWeeklyMeta}
          chartLabel="Compras na Semana"
          metrics={metaCardMetrics}
          isLoading={meta.isLoading}
        />
        <PlatformMetricsCard
          platform="google_ads"
          title="Google Ads"
          chartData={mockWeeklyGoogle}
          chartLabel="Conversões na Semana"
          metrics={googleAdsCardMetrics}
          isLoading={googleAds.isLoading}
        />
        <LeadsAnalyticsCard
          chartData={mockWeeklyAnalytics}
          metrics={analyticsCardMetrics}
          isLoading={ga4.isLoading}
        />
      </div>

      {/* Region Chart */}
      <LeadsRegionDonutChart data={mockRegionData} isLoading={isLoading} />
    </div>
  );
}
