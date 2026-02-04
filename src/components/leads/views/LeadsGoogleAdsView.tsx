import * as React from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, ChevronLeft, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { KPICard } from "@/components/leads/KPICard";
import { KeywordsTable } from "@/components/leads/charts/KeywordsTable";
import { MultiLineChart } from "@/components/leads/charts/MultiLineChart";
import { CampaignsTable } from "@/components/leads/charts/CampaignsTable";
import { DonutWithLegend } from "@/components/leads/charts/DonutWithLegend";
import { ViewFilters, GOOGLE_ADS_FILTERS } from "@/components/leads/ViewFilters";
import { GoogleAdsIcon } from "@/components/leads/icons/PlatformIcons";
import { formatCurrency, formatNumber, formatPercent } from "@/hooks/useLeadsMetrics";

interface LeadsGoogleAdsViewProps {
  googleAds: any;
  isLoading: boolean;
}

// Mock data matching reference
const mockKeywords = [
  { keyword: "google", cliques: 61, conversoes: 57.92 },
  { keyword: "serviços contabilidade", cliques: 46, conversoes: 46.33 },
  { keyword: "como abrir empresa", cliques: 23, conversoes: 24 },
  { keyword: "cnpj - significado", cliques: 21, conversoes: 19.94 },
  { keyword: "empresa brasil", cliques: 17, conversoes: 15 },
  { keyword: "abrir negócio", cliques: 15, conversoes: 15 },
  { keyword: "mei limite", cliques: 13, conversoes: 13 },
  { keyword: "cnpj", cliques: 11, conversoes: 8.92 },
  { keyword: "cnpj consulta", cliques: 11, conversoes: 11 },
  { keyword: "significado cnpj mei", cliques: 11, conversoes: 11 },
  { keyword: "mei significado", cliques: 9, conversoes: 8 },
  { keyword: "cnpj mei", cliques: 9, conversoes: 10 },
  { keyword: "contabilidade", cliques: 6, conversoes: 7 },
];

const mockChartData = [
  { date: "15/07", investimento: 80, conversoes: 90, custoConversao: 1.1 },
  { date: "17/07", investimento: 95, conversoes: 100, custoConversao: 1.0 },
  { date: "19/07", investimento: 110, conversoes: 95, custoConversao: 1.2 },
  { date: "21/07", investimento: 85, conversoes: 85, custoConversao: 1.0 },
  { date: "23/07", investimento: 130, conversoes: 120, custoConversao: 1.1 },
  { date: "25/07", investimento: 100, conversoes: 95, custoConversao: 1.1 },
  { date: "27/07", investimento: 75, conversoes: 80, custoConversao: 0.9 },
  { date: "29/07", investimento: 120, conversoes: 110, custoConversao: 1.1 },
  { date: "31/07", investimento: 95, conversoes: 90, custoConversao: 1.1 },
  { date: "02/08", investimento: 140, conversoes: 130, custoConversao: 1.1 },
  { date: "04/08", investimento: 110, conversoes: 105, custoConversao: 1.0 },
  { date: "06/08", investimento: 85, conversoes: 80, custoConversao: 1.1 },
  { date: "08/08", investimento: 125, conversoes: 115, custoConversao: 1.1 },
];

const mockGenderData = [
  { name: "Female", value: 45, color: "#22C55E" },
  { name: "Male", value: 41, color: "#3B82F6" },
  { name: "Undetermined", value: 14, color: "#6B7280" },
];

const mockCampaigns = [
  { name: "SEARCH - Brand - Principal", investimento: 2075.87, custoConversao: 1.09, conversoes: 1911.4, taxaConversao: 96.68, isHighlighted: true },
  { name: "SEARCH - Generic - Services", investimento: 0, custoConversao: 0, conversoes: 0, taxaConversao: 0 },
  { name: "SEARCH - Competitor - Keywords", investimento: 0, custoConversao: 0, conversoes: 0, taxaConversao: 0 },
  { name: "DISPLAY - Remarketing", investimento: 0, custoConversao: 0, conversoes: 0, taxaConversao: 0 },
  { name: "YOUTUBE - Awareness", investimento: 0, custoConversao: 0, conversoes: 0, taxaConversao: 0 },
];

export function LeadsGoogleAdsView({ googleAds, isLoading }: LeadsGoogleAdsViewProps) {
  const hasData = googleAds.connected && googleAds.data?.metrics;
  const metrics = googleAds.data?.metrics;
  
  // Pagination state for keywords
  const [keywordsPage, setKeywordsPage] = React.useState(1);
  const keywordsPerPage = 10;
  const totalKeywords = 793; // Mock total
  const displayedKeywords = mockKeywords.slice(0, keywordsPerPage);

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <GoogleAdsIcon className="h-6 w-6" />
          <h2 className="text-lg font-semibold text-foreground">Relatório Google Ads</h2>
        </div>
        <ViewFilters filters={GOOGLE_ADS_FILTERS} />
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
        <KPICard
          title="Investimento"
          value={hasData ? formatCurrency(metrics.spend) : "R$ 2.075,87"}
          change={-5.8}
          variant="google"
          showProgress
          progressValue={65}
        />
        <KPICard
          title="Conversões"
          value={hasData ? formatNumber(metrics.conversions) : "1.911,4"}
          change={-5.0}
          variant="success"
          showProgress
          progressValue={78}
        />
        <KPICard
          title="Custo por Conversão"
          value={hasData ? formatCurrency(metrics.cpc || 1.09) : "R$ 1,09"}
          change={-0.8}
          variant="primary"
          showProgress
          progressValue={45}
        />
        <KPICard
          title="Cliques"
          value={hasData ? formatNumber(metrics.clicks) : "1.977"}
          change={-3.8}
          variant="warning"
          showProgress
          progressValue={60}
        />
        <KPICard
          title="CPC Médio"
          value={hasData ? formatCurrency(metrics.cpc) : "R$ 1,05"}
          change={-2.1}
          showProgress
          progressValue={35}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Keywords Table with Pagination */}
        <Card className="p-4 bg-card/60 backdrop-blur-sm border-border/40 md:row-span-2">
          <KeywordsTable keywords={displayedKeywords} />
          
          {/* Pagination */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/30">
            <span className="text-[10px] text-muted-foreground">
              1-{keywordsPerPage} de {totalKeywords}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                disabled={keywordsPage === 1}
                onClick={() => setKeywordsPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setKeywordsPage((p) => p + 1)}
              >
                <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
          </div>
          
          {/* Bottom KPIs */}
          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-border/30">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase">CTR</p>
              <p className="text-lg font-bold text-foreground">3.29%</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase">Taxa de Conversão</p>
              <p className="text-lg font-bold text-foreground">96.68%</p>
            </div>
          </div>
        </Card>

        {/* Multi-line Chart */}
        <Card className="p-4 bg-card/60 backdrop-blur-sm border-border/40 md:col-span-2 lg:col-span-2">
          {/* Chart legend */}
          <div className="flex flex-wrap items-center gap-3 md:gap-4 text-xs mb-4">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span className="text-muted-foreground">Investimento</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-muted-foreground">Conversões</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
              <span className="text-muted-foreground">Custo por Conversão</span>
            </div>
          </div>

          <MultiLineChart
            data={mockChartData}
            lines={[
              { dataKey: "investimento", color: "#3B82F6", label: "Investimento" },
              { dataKey: "conversoes", color: "#22C55E", label: "Conversões" },
              { dataKey: "custoConversao", color: "#F97316", label: "Custo por Conversão" },
            ]}
            height={220}
          />
        </Card>

        {/* Gender Donut */}
        <Card className="p-4 bg-card/60 backdrop-blur-sm border-border/40">
          <h3 className="text-sm font-medium text-foreground mb-4">
            Conversões por Gênero
          </h3>
          <DonutWithLegend
            data={mockGenderData}
            height={160}
            showPercentage
          />
        </Card>
      </div>

      {/* Campaigns Table */}
      <Card className="p-4 bg-card/60 backdrop-blur-sm border-border/40">
        <CampaignsTable campaigns={mockCampaigns} platform="google_ads" />
      </Card>
    </div>
  );
}
