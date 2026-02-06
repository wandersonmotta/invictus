import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { rpcUntyped } from "@/lib/rpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  RefreshCw,
  DollarSign,
  TrendingUp,
  XCircle,
  Clock,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface KPIs {
  totalApprovedGross: number;
  totalFees: number;
  rejectedCount: number;
  pendingCount: number;
  pendingTotal: number;
}

interface RecentRow {
  withdrawal_id: string;
  display_name: string | null;
  username: string | null;
  gross_amount: number;
  net_amount: number;
  fee_amount: number;
  status: string;
  requested_at: string;
  reviewed_at: string | null;
}

export default function FinanceiroRelatorios() {
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [recent, setRecent] = useState<RecentRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);

    // KPIs: simple query without profile join
    const { data: all } = await supabase
      .from("withdrawal_requests")
      .select("gross_amount, fee_amount, net_amount, status")
      .limit(1000);

    if (all) {
      const approved = all.filter((r) => r.status === "approved");
      const rejected = all.filter((r) => r.status === "rejected");
      const pending = all.filter((r) => r.status === "pending");

      setKpis({
        totalApprovedGross: approved.reduce((s, r) => s + Number(r.gross_amount), 0),
        totalFees: approved.reduce((s, r) => s + Number(r.fee_amount), 0),
        rejectedCount: rejected.length,
        pendingCount: pending.length,
        pendingTotal: pending.reduce((s, r) => s + Number(r.gross_amount), 0),
      });
    }

    // Recent processed withdrawals via RPC (includes profile names)
    const { data: recentData } = await rpcUntyped<RecentRow[]>(
      "list_processed_withdrawals",
      { p_limit: 20 }
    );
    if (recentData) {
      setRecent(recentData);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  const kpiCards = kpis
    ? [
        {
          title: "Saques Aprovados",
          value: formatCurrency(kpis.totalApprovedGross),
          icon: DollarSign,
          color: "text-green-500",
        },
        {
          title: "Taxas Arrecadadas",
          value: formatCurrency(kpis.totalFees),
          icon: TrendingUp,
          color: "text-[hsl(var(--gold))]",
        },
        {
          title: "Saques Recusados",
          value: String(kpis.rejectedCount),
          icon: XCircle,
          color: "text-destructive",
        },
        {
          title: "Pendentes",
          value: `${kpis.pendingCount} (${formatCurrency(kpis.pendingTotal)})`,
          icon: Clock,
          color: "text-amber-500",
        },
      ]
    : [];

  const statusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge variant="outline" className="border-green-500/50 bg-green-500/10 text-green-500">
            Aprovado
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="outline" className="border-destructive/50 bg-destructive/10 text-destructive">
            Recusado
          </Badge>
        );
      default:
        return <Badge variant="outline">Pendente</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Relatórios Financeiros</h1>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {/* KPI Cards */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpiCards.map((kpi) => (
            <Card key={kpi.title}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted ${kpi.color}`}>
                  <kpi.icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">{kpi.title}</p>
                  <p className="text-lg font-bold truncate">{kpi.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Recent table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Últimos Saques
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-48 w-full" />
          ) : recent.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              Nenhum saque registrado
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Membro</TableHead>
                  <TableHead className="text-right">Bruto</TableHead>
                  <TableHead className="text-right">Líquido</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recent.map((w) => {
                  const displayName =
                    w.display_name ||
                    (w.username
                      ? w.username.startsWith("@")
                        ? w.username
                        : `@${w.username}`
                      : "Membro");

                  return (
                    <TableRow key={w.withdrawal_id}>
                      <TableCell className="font-medium">{displayName}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(w.gross_amount)}
                      </TableCell>
                      <TableCell className="text-right text-[hsl(var(--gold))]">
                        {formatCurrency(w.net_amount)}
                      </TableCell>
                      <TableCell>{statusBadge(w.status)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(
                          new Date(w.reviewed_at || w.requested_at),
                          "dd/MM/yy HH:mm",
                          { locale: ptBR }
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
