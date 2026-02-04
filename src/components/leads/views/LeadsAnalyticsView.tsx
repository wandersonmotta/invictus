import * as React from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { KPICard } from "@/components/leads/KPICard";
import { DonutWithLegend } from "@/components/leads/charts/DonutWithLegend";
import { WeeklyBarChart } from "@/components/leads/charts/WeeklyBarChart";
import { DualLineChart } from "@/components/leads/charts/DualLineChart";
import { BrazilMap } from "@/components/leads/charts/BrazilMap";
import { ViewFilters, ANALYTICS_FILTERS } from "@/components/leads/ViewFilters";
import { AnalyticsIcon } from "@/components/leads/icons/PlatformIcons";
import { formatNumber, formatPercent } from "@/hooks/useLeadsMetrics";
import { Progress } from "@/components/ui/progress";

interface LeadsAnalyticsViewProps {
  ga4: any;
  isLoading: boolean;
}

// Mock data matching reference
const mockAccessData = [
  { date: "1", value: 280 },
  { date: "3", value: 350 },
  { date: "5", value: 420 },
  { date: "7", value: 380 },
  { date: "9", value: 450 },
  { date: "11", value: 320 },
  { date: "13", value: 280 },
  { date: "15", value: 400 },
  { date: "17", value: 350 },
  { date: "19", value: 480 },
  { date: "21", value: 420 },
  { date: "23", value: 350 },
  { date: "25", value: 300 },
  { date: "26", value: 380 },
];

const mockWeeklyData = [
  { day: "Segunda", value: 980 },
  { day: "Terça", value: 1100 },
  { day: "Quarta", value: 1250 },
  { day: "Quinta", value: 1180 },
  { day: "Sexta", value: 1400 },
  { day: "Sábado", value: 920 },
  { day: "Domingo", value: 780 },
];

const mockOsData = [
  { name: "iOS", value: 45, color: "#F97316" },
  { name: "Android", value: 35, color: "#EA580C" },
  { name: "Windows", value: 12, color: "#C2410C" },
  { name: "Mac", value: 5, color: "#9A3412" },
  { name: "Linux", value: 3, color: "#7C2D12" },
];

const mockDeviceData = [
  { name: "Mobile", value: 55, color: "#F97316" },
  { name: "Desktop", value: 38, color: "#EA580C" },
  { name: "Tablet", value: 7, color: "#C2410C" },
];

const mockOriginData = [
  { name: "google", value: 3200, color: "#F97316" },
  { name: "(direct)", value: 1800, color: "#EA580C" },
  { name: "facebook", value: 950, color: "#C2410C" },
  { name: "instagram", value: 720, color: "#9A3412" },
  { name: "linkedin", value: 380, color: "#7C2D12" },
  { name: "twitter", value: 220, color: "#6B7280" },
  { name: "Others", value: 1084, color: "#4B5563" },
];

const mockRegions = [
  { regiao: "São Paulo", cidade: "São Paulo", acessos: 1908 },
  { regiao: "Rio de Janeiro", cidade: "Rio de Janeiro", acessos: 277 },
  { regiao: "Minas Gerais", cidade: "Belo Horizonte", acessos: 246 },
  { regiao: "Distrito Federal", cidade: "Brasília", acessos: 221 },
  { regiao: "Paraná", cidade: "Curitiba", acessos: 189 },
  { regiao: "Goiás", cidade: "Goiânia", acessos: 188 },
  { regiao: "Ceará", cidade: "Fortaleza", acessos: 167 },
  { regiao: "Santa Catarina", cidade: "Florianópolis", acessos: 156 },
];

const mockUrls = [
  { url: "invictusfraternidade.com.br/", acessos: 1241 },
  { url: "invictusfraternidade.com.br/sobre", acessos: 892 },
  { url: "invictusfraternidade.com.br/contato", acessos: 654 },
  { url: "invictusfraternidade.com.br/blog", acessos: 423 },
];

const mockMapData = [
  { code: "SP", name: "São Paulo", value: 1908 },
  { code: "RJ", name: "Rio de Janeiro", value: 277 },
  { code: "MG", name: "Minas Gerais", value: 246 },
  { code: "DF", name: "Distrito Federal", value: 221 },
  { code: "PR", name: "Paraná", value: 189 },
  { code: "GO", name: "Goiás", value: 188 },
  { code: "CE", name: "Ceará", value: 167 },
  { code: "SC", name: "Santa Catarina", value: 156 },
];

export function LeadsAnalyticsView({ ga4, isLoading }: LeadsAnalyticsViewProps) {
  const hasData = ga4.connected && ga4.data?.metrics;
  const metrics = ga4.data?.metrics;
  const maxAcessos = Math.max(...mockRegions.map((r) => r.acessos));

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <AnalyticsIcon className="h-6 w-6" />
          <h2 className="text-lg font-semibold text-foreground">Relatório Analytics</h2>
        </div>
        <ViewFilters filters={ANALYTICS_FILTERS} />
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <KPICard
          title="Acessos Totais"
          value={hasData ? formatNumber(metrics.sessions) : "8.354"}
          change={-22.5}
          variant="analytics"
          showProgress
          progressValue={75}
        />
        <KPICard
          title="Usuários Totais"
          value={hasData ? formatNumber(metrics.users) : "7.105"}
          change={-24.7}
          variant="analytics"
          showProgress
          progressValue={68}
        />
        <KPICard
          title="Novos Usuários"
          value={hasData ? formatNumber(metrics.newUsers || 6443) : "6.443"}
          change={-4.2}
          variant="analytics"
          showProgress
          progressValue={62}
        />
        <KPICard
          title="Visualizações de Páginas"
          value={hasData ? formatNumber(metrics.pageviews) : "8.959"}
          change={-23.5}
          variant="analytics"
          showProgress
          progressValue={70}
        />
        <KPICard
          title="Taxa de Engajamento"
          value={hasData ? formatPercent(metrics.engagementRate || 28.36) : "28.36%"}
          change={0}
          variant="analytics"
          showProgress
          progressValue={45}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Brazil Map + Region Table */}
        <Card className="p-4 bg-card/60 backdrop-blur-sm border-border/40 md:col-span-2 lg:col-span-1 lg:row-span-2">
          {/* Brazil Map */}
          <BrazilMap data={mockMapData} className="mb-4" />
          
          {/* Region Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground uppercase tracking-wide px-1">
              <span>Região</span>
              <div className="flex gap-8">
                <span>Cidade</span>
                <span>Acessos</span>
              </div>
            </div>
            <div className="space-y-1 max-h-[220px] overflow-y-auto">
              {mockRegions.map((region, i) => (
                <div
                  key={i}
                  className="grid grid-cols-[1fr_1fr_auto] items-center gap-2 px-1 py-1.5 rounded hover:bg-muted/20 transition-colors"
                >
                  <span className="text-xs text-foreground whitespace-nowrap overflow-hidden text-ellipsis">
                    {region.regiao}
                  </span>
                  <span className="text-xs text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis text-center">
                    {region.cidade}
                  </span>
                  <div className="flex items-center gap-2">
                    <Progress
                      value={(region.acessos / maxAcessos) * 100}
                      className="h-1.5 w-14"
                      style={{ "--progress-color": "#F97316" } as React.CSSProperties}
                    />
                    <span className="text-xs font-medium text-foreground tabular-nums w-12 text-right">
                      {region.acessos.toLocaleString("pt-BR")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Access Period Chart */}
        <Card className="p-4 bg-card/60 backdrop-blur-sm border-border/40">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
            <span className="text-xs text-muted-foreground">Acessos no Período</span>
          </div>
          <div className="h-[160px]">
            <DualLineChart
              data={mockAccessData.map((d) => ({ date: d.date, meta: d.value, google: 0 }))}
              height={160}
            />
          </div>
        </Card>

        {/* Weekly Bar Chart */}
        <Card className="p-4 bg-card/60 backdrop-blur-sm border-border/40">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
            <span className="text-xs text-muted-foreground">Acessos na Semana</span>
          </div>
          <WeeklyBarChart data={mockWeeklyData} color="#F97316" height={160} />
        </Card>

        {/* Origin Donut */}
        <Card className="p-4 bg-card/60 backdrop-blur-sm border-border/40">
          <h3 className="text-sm font-medium text-foreground mb-4">Origem dos Acessos</h3>
          <DonutWithLegend data={mockOriginData} height={140} showPercentage />
        </Card>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* OS Donut */}
        <Card className="p-4 bg-card/60 backdrop-blur-sm border-border/40">
          <h3 className="text-sm font-medium text-foreground mb-4">Sistema Operacional</h3>
          <DonutWithLegend data={mockOsData} height={140} showPercentage />
        </Card>

        {/* Device Donut */}
        <Card className="p-4 bg-card/60 backdrop-blur-sm border-border/40">
          <h3 className="text-sm font-medium text-foreground mb-4">Dispositivo</h3>
          <DonutWithLegend data={mockDeviceData} height={140} showPercentage />
        </Card>

        {/* URLs Table */}
        <Card className="p-4 bg-card/60 backdrop-blur-sm border-border/40">
          <h3 className="text-sm font-medium text-foreground mb-4">Acessos por URL</h3>
          <div className="space-y-2">
            {mockUrls.map((url, i) => {
              const maxUrlAcessos = Math.max(...mockUrls.map((u) => u.acessos));
              return (
                <div
                  key={i}
                  className="flex items-center justify-between px-1 py-1.5 rounded hover:bg-muted/20 transition-colors"
                >
                  <span className="text-xs text-muted-foreground truncate max-w-[180px]">
                    {url.url}
                  </span>
                  <div className="flex items-center gap-2">
                    <Progress
                      value={(url.acessos / maxUrlAcessos) * 100}
                      className="h-1.5 w-12"
                      style={{ "--progress-color": "#F97316" } as React.CSSProperties}
                    />
                    <span className="text-xs font-medium text-foreground w-10 text-right">
                      {url.acessos.toLocaleString("pt-BR")}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
