import * as React from "react";
import { cn } from "@/lib/utils";
import { TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { KPICard } from "@/components/leads/KPICard";
import { FunnelChart } from "@/components/leads/charts/FunnelChart";
import { MultiLineChart } from "@/components/leads/charts/MultiLineChart";
import { CampaignsTable, type Campaign } from "@/components/leads/charts/CampaignsTable";
import { DonutWithLegend } from "@/components/leads/charts/DonutWithLegend";
import { ViewFilters, META_FILTERS } from "@/components/leads/ViewFilters";
import { MetaIcon } from "@/components/leads/icons/PlatformIcons";
import { formatCurrency, formatNumber } from "@/hooks/useLeadsMetrics";
import { useMetaCampaigns } from "@/hooks/useMetaCampaigns";

interface LeadsMetaViewProps {
  meta: any;
  isLoading: boolean;
}

// Mock data matching reference
const mockFunnelSteps = [
  { label: "Cliques", value: 8000, rate: 0.93, rateLabel: "Taxa de Cliques" },
  { label: "Page Views", value: 8000, rate: 93.31, rateLabel: "Connect Rate" },
  { label: "Checkouts", value: 2474, rate: 31.30, rateLabel: "Taxa de Checkout" },
  { label: "Compras", value: 720, rate: 29.10, rateLabel: "Taxa de Compras" },
];

const mockRevenueData = [
  { date: "13/07", faturamento: 1200, compras: 1.2 },
  { date: "16/07", faturamento: 1500, compras: 1.5 },
  { date: "19/07", faturamento: 1800, compras: 1.8 },
  { date: "22/07", faturamento: 2100, compras: 2.0 },
  { date: "25/07", faturamento: 1900, compras: 1.7 },
  { date: "28/07", faturamento: 2500, compras: 2.2 },
  { date: "31/07", faturamento: 2200, compras: 2.0 },
  { date: "03/08", faturamento: 2800, compras: 2.5 },
  { date: "06/08", faturamento: 2400, compras: 2.1 },
  { date: "09/08", faturamento: 3000, compras: 2.8 },
];

const mockBestAds = [
  { name: "Ad 1", value: 35, color: "hsl(var(--primary))" },
  { name: "Ad 2", value: 28, color: "hsl(142 76% 36%)" },
  { name: "Ad 3", value: 22, color: "hsl(25 95% 53%)" },
  { name: "Outros", value: 15, color: "hsl(var(--muted-foreground))" },
];

const mockCampaigns: Campaign[] = [
  { name: "CAM - Sales - Remarketing 2025", status: "ACTIVE", thumbnailUrl: null, conjuntos: 3, anuncios: 12, investimento: 5276.77, custoConversao: 25.13, compras: 212 },
  { name: "CAM - Sales - Lookalike", status: "ACTIVE", thumbnailUrl: null, conjuntos: 2, anuncios: 8, investimento: 3575.28, custoConversao: 21.48, compras: 166 },
  { name: "CAM - Sales - Interest", status: "PAUSED", thumbnailUrl: null, conjuntos: 4, anuncios: 15, investimento: 903.82, custoConversao: 30.12, compras: 30 },
  { name: "CAM - Awareness - Brand", status: "PAUSED", thumbnailUrl: null, conjuntos: 1, anuncios: 3, investimento: 879.16, custoConversao: 43.95, compras: 20 },
  { name: "CAM - Traffic - Blog", status: "ACTIVE", thumbnailUrl: null, conjuntos: 2, anuncios: 6, investimento: 501.25, custoConversao: 55.69, compras: 9 },
];

export function LeadsMetaView({ meta, isLoading }: LeadsMetaViewProps) {
  const hasData = meta.connected && meta.data?.metrics;
  const metrics = meta.data?.metrics;

  // Fetch real campaigns when connected
  const { data: campaignsData, isLoading: campaignsLoading } = useMetaCampaigns({
    enabled: meta.connected,
  });

  // Transform API campaigns to table format or use mock data
  const campaigns: Campaign[] = React.useMemo(() => {
    if (campaignsData?.connected && campaignsData.campaigns?.length) {
      return campaignsData.campaigns.map((c) => ({
        name: c.name,
        status: c.status,
        thumbnailUrl: c.thumbnail_url,
        conjuntos: c.ad_sets_count,
        anuncios: c.ads_count,
        investimento: c.insights.spend,
        custoConversao: c.insights.cost_per_purchase,
        compras: c.insights.purchases,
      }));
    }
    return mockCampaigns;
  }, [campaignsData]);

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <MetaIcon className="text-xl" />
          <h2 className="text-lg font-semibold text-foreground">Relatório Meta Ads</h2>
        </div>
        <ViewFilters filters={META_FILTERS} />
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <KPICard
          title="Investimento"
          value={hasData ? formatCurrency(metrics.spend) : "R$ 22.993,14"}
          change={16.6}
          variant="meta"
          showProgress
          progressValue={70}
        />
        <KPICard
          title="Faturamento"
          value={hasData ? formatCurrency(metrics.revenue || 32718.87) : "R$ 32.718,87"}
          change={43.4}
          variant="success"
          showProgress
          progressValue={85}
        />
        <KPICard
          title="Compras"
          value={hasData ? formatNumber(metrics.purchases) : "720"}
          change={54.2}
          variant="primary"
          showProgress
          progressValue={72}
        />
        <KPICard
          title="ROAS Médio"
          value={hasData ? formatNumber(metrics.roas, 2) : "1.42"}
          change={23.0}
          variant="warning"
          showProgress
          progressValue={55}
        />
        <KPICard
          title="Custo por Compra (CPA)"
          value={hasData ? formatCurrency(metrics.cpa || 31.93) : "R$ 31,93"}
          change={-28.8}
          showProgress
          progressValue={40}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Funnel */}
        <Card className="p-4 bg-card/60 backdrop-blur-sm border-border/40">
          <h3 className="text-sm font-medium text-foreground mb-4">Funil de Tráfego</h3>
          <FunnelChart steps={mockFunnelSteps} />
          
          {/* Bottom metrics */}
          <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-border/30">
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground uppercase">Add to Cart</p>
              <p className="text-sm font-semibold text-foreground">0</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground uppercase">Frequência</p>
              <p className="text-sm font-semibold text-foreground">3.98</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground uppercase">CPM</p>
              <p className="text-sm font-semibold text-foreground">R$ 25,13</p>
            </div>
          </div>
        </Card>

        {/* Revenue Chart + Checkout metrics */}
        <Card className="p-4 bg-card/60 backdrop-blur-sm border-border/40">
          <div className="space-y-4">
            {/* Checkout metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase">Checkouts Iniciados</p>
                <p className="text-xl font-bold text-foreground">2.474</p>
                <span className="flex items-center text-[10px] text-emerald-500">
                  <TrendingUp className="h-2.5 w-2.5 mr-0.5" />
                  152.2%
                </span>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase">Custo por Checkout</p>
                <p className="text-xl font-bold text-foreground">R$ 9,29</p>
              </div>
            </div>

            {/* Chart legend */}
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "hsl(142 76% 36%)" }} />
                <span className="text-muted-foreground">Faturamento</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                <span className="text-muted-foreground">Compras</span>
              </div>
            </div>

            {/* Revenue vs Purchases chart */}
            <MultiLineChart
              data={mockRevenueData}
              lines={[
                { dataKey: "faturamento", color: "hsl(142 76% 36%)", label: "Faturamento" },
                { dataKey: "compras", color: "hsl(var(--primary))", label: "Compras" },
              ]}
              height={180}
            />
          </div>
        </Card>

        {/* Best Ads Donut */}
        <Card className="p-4 bg-card/60 backdrop-blur-sm border-border/40">
          <h3 className="text-sm font-medium text-foreground mb-4">
            Melhores Anúncios (Conversões)
          </h3>
          <DonutWithLegend
            data={mockBestAds}
            height={120}
            showPercentage
            layout="vertical"
          />
        </Card>
      </div>

      {/* Campaigns Table */}
      <Card className="p-4 bg-card/60 backdrop-blur-sm border-border/40">
        <h3 className="text-sm font-medium text-foreground mb-4">Campanhas</h3>
        <CampaignsTable 
          campaigns={campaigns} 
          platform="meta" 
        />
      </Card>
    </div>
  );
}
