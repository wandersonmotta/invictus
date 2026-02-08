import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { rpcUntyped } from "@/lib/rpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  RefreshCw,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PaymentRow {
  payment_id: string;
  user_id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  service_type: string;
  status: string;
  amount_cents: number;
  item_count: number;
  payment_provider: string;
  created_at: string;
  paid_at: string | null;
  expires_at: string | null;
}

type FilterTab = "todos" | "pending" | "approved" | "expired";

export default function FinanceiroPagamentos() {
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<FilterTab>("todos");

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data } = await rpcUntyped<PaymentRow[]>("list_all_service_payments", { p_limit: 200 });
    if (data) setPayments(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("financeiro-payments")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "service_payments" },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  const filtered = payments.filter((p) => {
    if (tab === "todos") return true;
    if (tab === "pending") return p.status === "pending";
    if (tab === "approved") return p.status === "approved";
    if (tab === "expired") return p.status === "expired";
    return true;
  });

  const pendingPayments = payments.filter((p) => p.status === "pending");
  const approvedPayments = payments.filter((p) => p.status === "approved");
  const expiredPayments = payments.filter((p) => p.status === "expired");

  const totalPending = pendingPayments.reduce((s, p) => s + p.amount_cents, 0);
  const totalApproved = approvedPayments.reduce((s, p) => s + p.amount_cents, 0);

  const formatCurrency = (cents: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);

  const memberName = (p: PaymentRow) =>
    p.display_name || (p.username ? (p.username.startsWith("@") ? p.username : `@${p.username}`) : "Membro");

  const statusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge variant="outline" className="border-green-500/50 bg-green-500/10 text-green-500">
            Aprovado
          </Badge>
        );
      case "expired":
        return (
          <Badge variant="outline" className="border-destructive/50 bg-destructive/10 text-destructive">
            Expirado
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="outline" className="border-amber-500/50 bg-amber-500/10 text-amber-500">
            Pendente
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const serviceLabel = (type: string) => {
    switch (type) {
      case "limpa_nome":
        return "Limpa Nome";
      default:
        return type;
    }
  };

  const kpiCards = [
    {
      title: "Total Pendente",
      value: formatCurrency(totalPending),
      sub: `${pendingPayments.length} pagamento(s)`,
      icon: Clock,
      color: "text-amber-500",
    },
    {
      title: "Total Aprovado",
      value: formatCurrency(totalApproved),
      sub: `${approvedPayments.length} pagamento(s)`,
      icon: CheckCircle2,
      color: "text-green-500",
    },
    {
      title: "Total Geral",
      value: formatCurrency(totalPending + totalApproved),
      sub: `${payments.length} registro(s)`,
      icon: DollarSign,
      color: "text-[hsl(var(--gold))]",
    },
    {
      title: "Expirados",
      value: String(expiredPayments.length),
      sub: formatCurrency(expiredPayments.reduce((s, p) => s + p.amount_cents, 0)),
      icon: AlertTriangle,
      color: "text-destructive",
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <h1 className="text-xl sm:text-2xl font-bold">Pagamentos</h1>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="shrink-0">
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">Atualizar</span>
        </Button>
      </div>

      {/* KPIs */}
      {loading ? (
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 sm:h-28 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          {kpiCards.map((kpi) => (
            <Card key={kpi.title}>
              <CardContent className="flex items-center gap-3 p-3 sm:p-4">
                <div className={`flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full bg-muted ${kpi.color}`}>
                  <kpi.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs text-muted-foreground">{kpi.title}</p>
                  <p className="text-sm sm:text-lg font-bold truncate">{kpi.value}</p>
                  <p className="text-[10px] text-muted-foreground">{kpi.sub}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Filter Tabs */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as FilterTab)}>
        <TabsList>
          <TabsTrigger value="todos">Todos</TabsTrigger>
          <TabsTrigger value="pending">Pendentes</TabsTrigger>
          <TabsTrigger value="approved">Aprovados</TabsTrigger>
          <TabsTrigger value="expired">Expirados</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Data */}
      <Card>
        <CardHeader className="px-3 sm:px-6">
          <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            {tab === "todos" ? "Todos os Pagamentos" : tab === "pending" ? "Pagamentos Pendentes" : tab === "approved" ? "Pagamentos Aprovados" : "Pagamentos Expirados"}
            {" "}({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 sm:px-6">
          {loading ? (
            <Skeleton className="h-48 w-full" />
          ) : filtered.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">Nenhum pagamento encontrado</p>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="pb-2 font-medium text-muted-foreground">Membro</th>
                      <th className="pb-2 font-medium text-muted-foreground">Serviço</th>
                      <th className="pb-2 font-medium text-muted-foreground text-right">Valor</th>
                      <th className="pb-2 font-medium text-muted-foreground text-center">Qtd</th>
                      <th className="pb-2 font-medium text-muted-foreground">Status</th>
                      <th className="pb-2 font-medium text-muted-foreground">Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((p) => (
                      <tr key={p.payment_id} className="border-b border-border/50">
                        <td className="py-2.5">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-7 w-7">
                              <AvatarImage src={p.avatar_url || undefined} />
                              <AvatarFallback className="text-[10px]">
                                {(p.display_name || "M").charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium truncate max-w-[160px]">{memberName(p)}</span>
                          </div>
                        </td>
                        <td className="py-2.5 text-muted-foreground">{serviceLabel(p.service_type)}</td>
                        <td className="py-2.5 text-right font-medium">{formatCurrency(p.amount_cents)}</td>
                        <td className="py-2.5 text-center text-muted-foreground">{p.item_count}</td>
                        <td className="py-2.5">{statusBadge(p.status)}</td>
                        <td className="py-2.5 text-muted-foreground">
                          {format(new Date(p.paid_at || p.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile card list */}
              <div className="sm:hidden space-y-2">
                {filtered.map((p) => (
                  <div key={p.payment_id} className="rounded-lg border border-border p-3 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar className="h-7 w-7 shrink-0">
                          <AvatarImage src={p.avatar_url || undefined} />
                          <AvatarFallback className="text-[10px]">
                            {(p.display_name || "M").charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-sm truncate">{memberName(p)}</span>
                      </div>
                      {statusBadge(p.status)}
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{serviceLabel(p.service_type)} · {p.item_count} item(ns)</span>
                      <span className="font-semibold text-sm text-foreground">{formatCurrency(p.amount_cents)}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(p.paid_at || p.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
