import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { CampaignPreviewCell } from "./CampaignPreviewCell";
import { Badge } from "@/components/ui/badge";

export interface Campaign {
  name: string;
  status?: string;
  thumbnailUrl?: string | null;
  conjuntos?: number;
  anuncios?: number;
  investimento: number;
  custoConversao?: number;
  compras?: number;
  conversoes?: number;
  taxaConversao?: number;
  isHighlighted?: boolean;
}

interface CampaignsTableProps {
  campaigns: Campaign[];
  platform: "meta" | "google_ads";
  className?: string;
}

export function CampaignsTable({ campaigns, platform, className }: CampaignsTableProps) {
  const isMobile = useIsMobile();

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  const maxInvestimento = Math.max(...campaigns.map((c) => c.investimento));

  // Mobile: render as stacked cards
  if (isMobile) {
    return (
      <div className={cn("space-y-3", className)}>
        {campaigns.map((campaign, index) => {
          const isActive = campaign.status === "ACTIVE";
          return (
            <div
              key={index}
              className={cn(
                "p-3 rounded-lg bg-muted/20 border border-border/30 space-y-3",
                campaign.isHighlighted && "bg-primary/10 border-primary/30"
              )}
            >
              {/* Campaign name + status */}
              <div className="flex items-start justify-between gap-2 min-w-0">
                <p className="text-sm font-medium text-foreground truncate min-w-0 flex-1">
                  {campaign.name}
                </p>
                {platform === "meta" && campaign.status && (
                  <Badge
                    variant={isActive ? "default" : "secondary"}
                    className={cn(
                      "flex-shrink-0 text-[10px] px-1.5 py-0 h-4",
                      isActive
                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                        : "bg-muted/50 text-muted-foreground border-border/30"
                    )}
                  >
                    {isActive ? "Ativo" : "Pausado"}
                  </Badge>
                )}
              </div>

              {/* Metrics grid */}
              <div className="grid grid-cols-2 gap-3">
                {/* Investimento */}
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase">Investimento</p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">
                      {formatCurrency(campaign.investimento)}
                    </span>
                  </div>
                  <Progress
                    value={(campaign.investimento / maxInvestimento) * 100}
                    className="h-1"
                    style={{ "--progress-color": "hsl(var(--primary))" } as React.CSSProperties}
                  />
                </div>

                {/* Custo por conversão/compra */}
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase">
                    {platform === "meta" ? "Custo/Compra" : "Custo/Conv."}
                  </p>
                  <span className="text-sm font-semibold text-foreground">
                    {campaign.custoConversao ? formatCurrency(campaign.custoConversao) : "-"}
                  </span>
                </div>

                {/* Compras ou Conversões */}
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase">
                    {platform === "meta" ? "Compras" : "Conversões"}
                  </p>
                  <span className="text-sm font-semibold text-foreground">
                    {platform === "meta"
                      ? campaign.compras ?? "-"
                      : campaign.conversoes ?? "-"}
                  </span>
                </div>

                {/* Taxa de conversão (Google Ads only) */}
                {platform === "google_ads" && (
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase">Taxa Conv.</p>
                    <span className="text-sm font-semibold text-foreground">
                      {campaign.taxaConversao ? `${campaign.taxaConversao.toFixed(2)}%` : "-"}
                    </span>
                  </div>
                )}

                {/* Meta: Conjuntos + Anúncios */}
                {platform === "meta" && (
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase">Conj. / Anún.</p>
                    <span className="text-sm font-semibold text-foreground">
                      {campaign.conjuntos ?? "-"} / {campaign.anuncios ?? "-"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Desktop: render as table
  return (
    <div className={cn("relative rounded-lg border border-border/40", className)}>
      {/* Scroll indicator for mobile */}
      <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-card/80 to-transparent pointer-events-none z-10 sm:hidden" />
      <div className="overflow-x-auto scrollbar-thin">
        <Table className="min-w-[600px]">
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            <TableHead className="text-xs font-medium text-muted-foreground">
              {platform === "meta" ? "Campanha" : "Campanhas"}
            </TableHead>
            {platform === "meta" && (
              <>
                <TableHead className="text-xs font-medium text-muted-foreground text-center hidden md:table-cell">
                  Conjuntos
                </TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground text-center hidden md:table-cell">
                  Anúncios
                </TableHead>
              </>
            )}
            <TableHead className="text-xs font-medium text-muted-foreground text-right">
              Investimento
            </TableHead>
            <TableHead className="text-xs font-medium text-muted-foreground text-right">
              {platform === "meta" ? "Custo por Compra" : "Custo por Conv."}
            </TableHead>
            <TableHead className="text-xs font-medium text-muted-foreground text-right">
              {platform === "meta" ? "Compras" : "Conversões"}
            </TableHead>
            {platform === "google_ads" && (
              <TableHead className="text-xs font-medium text-muted-foreground text-right">
                Taxa de Conv.
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {campaigns.map((campaign, index) => (
            <TableRow
              key={index}
              className={cn(
                "hover:bg-muted/20",
                campaign.isHighlighted && "bg-primary/10"
              )}
            >
              <TableCell className="py-3">
                {platform === "meta" ? (
                  <CampaignPreviewCell
                    name={campaign.name}
                    thumbnailUrl={campaign.thumbnailUrl ?? null}
                    status={campaign.status || "PAUSED"}
                  />
                ) : (
                  <span className="text-sm font-medium text-foreground max-w-[200px] truncate block">
                    {campaign.name}
                  </span>
                )}
              </TableCell>
              {platform === "meta" && (
                <>
                  <TableCell className="text-sm text-center text-muted-foreground hidden md:table-cell">
                    {campaign.conjuntos ?? "-"}
                  </TableCell>
                  <TableCell className="text-sm text-center text-muted-foreground hidden md:table-cell">
                    {campaign.anuncios ?? "-"}
                  </TableCell>
                </>
              )}
              <TableCell className="text-right">
                <div className="flex flex-col items-end gap-1">
                  <span className="text-sm font-medium text-foreground">
                    {formatCurrency(campaign.investimento)}
                  </span>
                  <Progress
                    value={(campaign.investimento / maxInvestimento) * 100}
                    className="h-1 w-16"
                    style={{ "--progress-color": "hsl(var(--primary))" } as React.CSSProperties}
                  />
                </div>
              </TableCell>
              <TableCell className="text-sm text-right text-muted-foreground">
                {campaign.custoConversao ? formatCurrency(campaign.custoConversao) : "-"}
              </TableCell>
              <TableCell className="text-sm text-right font-medium text-foreground">
                {platform === "meta"
                  ? campaign.compras ?? "-"
                  : campaign.conversoes ?? "-"}
              </TableCell>
              {platform === "google_ads" && (
                <TableCell className="text-sm text-right text-muted-foreground">
                  {campaign.taxaConversao ? `${campaign.taxaConversao.toFixed(2)}%` : "-"}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </div>
    </div>
  );
}
