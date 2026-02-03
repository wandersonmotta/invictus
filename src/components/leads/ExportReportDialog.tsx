import * as React from "react";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { Download, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/auth/AuthProvider";
import { useToast } from "@/hooks/use-toast";

interface ExportReportDialogProps {
  dateRange: DateRange | undefined;
  aggregatedData: {
    totalSpend: number;
    totalConversions: number;
    totalRevenue: number;
    roi: number;
  };
  metaMetrics?: {
    spend: number;
    impressions: number;
    clicks: number;
    purchases: number;
    roas: number;
  };
  googleAdsMetrics?: {
    spend: number;
    impressions: number;
    clicks: number;
    conversions: number;
  };
  ga4Metrics?: {
    sessions: number;
    users: number;
    pageviews: number;
    bounceRate: number;
  };
}

export function ExportReportDialog({
  dateRange,
  aggregatedData,
  metaMetrics,
  googleAdsMetrics,
  ga4Metrics,
}: ExportReportDialogProps) {
  const { session } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState("Relatório de Marketing");
  const [isExporting, setIsExporting] = React.useState(false);

  const handleExport = async () => {
    if (!session?.access_token) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para exportar.",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);

    try {
      const startDate = dateRange?.from
        ? format(dateRange.from, "yyyy-MM-dd")
        : format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd");
      const endDate = dateRange?.to
        ? format(dateRange.to, "yyyy-MM-dd")
        : format(new Date(), "yyyy-MM-dd");

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/leads-generate-report`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title,
            period: { start: startDate, end: endDate },
            kpis: {
              investimento: aggregatedData.totalSpend,
              conversoes: aggregatedData.totalConversions,
              faturamento: aggregatedData.totalRevenue,
              roi: aggregatedData.roi,
            },
            platforms: {
              meta: metaMetrics,
              googleAds: googleAdsMetrics,
              ga4: ga4Metrics,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Falha ao gerar relatório");
      }

      const html = await response.text();

      // Open in new window for printing
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
      }

      toast({
        title: "Relatório gerado!",
        description: "O relatório foi aberto em uma nova janela para impressão/download.",
      });

      setOpen(false);
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Erro",
        description: "Falha ao gerar relatório. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Download className="h-4 w-4 mr-2" />
          Exportar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Exportar Relatório</DialogTitle>
          <DialogDescription>
            Gere um relatório em PDF com os dados do período selecionado.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título do Relatório</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Relatório de Marketing"
            />
          </div>
          <div className="text-sm text-muted-foreground">
            <p>
              <strong>Período:</strong>{" "}
              {dateRange?.from
                ? format(dateRange.from, "dd/MM/yyyy")
                : "Início"}{" "}
              -{" "}
              {dateRange?.to ? format(dateRange.to, "dd/MM/yyyy") : "Hoje"}
            </p>
            <p className="mt-1">
              <strong>Plataformas:</strong>{" "}
              {[
                metaMetrics ? "Meta Ads" : null,
                googleAdsMetrics ? "Google Ads" : null,
                ga4Metrics ? "Google Analytics" : null,
              ]
                .filter(Boolean)
                .join(", ") || "Nenhuma conectada"}
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Gerar PDF
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
