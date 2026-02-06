import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { rpcUntyped } from "@/lib/rpc";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { isLovableHost } from "@/lib/appOrigin";

interface AuditDetails {
  withdrawal: {
    id: string;
    gross_amount: number;
    fee_amount: number;
    net_amount: number;
    pix_key: string;
    status: string;
    requested_at: string;
    reviewed_at: string | null;
    rejection_reason: string | null;
  };
  member: {
    user_id: string;
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
    pix_key: string | null;
    created_at: string;
  };
  financial_summary: {
    total_credits: number;
    total_debits: number;
    current_balance: number;
    pending_withdrawals: number;
  };
  transactions: Array<{
    id: string;
    type: string;
    amount: number;
    description: string;
    source_type: string;
    created_at: string;
  }> | null;
  commission_details: Array<{
    id: string;
    product_name: string;
    product_sku: string | null;
    sale_amount: number;
    commission_rate: number;
    level: number;
    created_at: string;
  }> | null;
  audit_history: Array<{
    id: string;
    action: string;
    performed_at: string;
    notes: string | null;
  }> | null;
}

export default function AuditoriaDetalhe() {
  const { withdrawalId } = useParams<{ withdrawalId: string }>();
  const navigate = useNavigate();
  const [details, setDetails] = useState<AuditDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [processing, setProcessing] = useState(false);

  const dashboardPath = isLovableHost(window.location.hostname)
    ? "/financeiro/dashboard"
    : "/dashboard";

  useEffect(() => {
    if (!withdrawalId) return;

    async function fetch() {
      setLoading(true);
      const { data, error } = await rpcUntyped<AuditDetails>(
        "get_withdrawal_audit_details",
        { p_withdrawal_id: withdrawalId }
      );
      if (!error && data) {
        setDetails(data);
      }
      setLoading(false);
    }

    fetch();
  }, [withdrawalId]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  const handleApprove = async () => {
    if (!withdrawalId) return;
    setProcessing(true);

    const { error } = await rpcUntyped("approve_withdrawal", {
      p_withdrawal_id: withdrawalId,
    });

    setProcessing(false);

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao aprovar",
        description: error.message,
      });
      return;
    }

    toast({
      title: "Saque aprovado",
      description: "O saque foi aprovado e registrado no sistema.",
    });

    navigate(dashboardPath);
  };

  const handleReject = async () => {
    if (!withdrawalId || !rejectReason.trim()) return;
    setProcessing(true);

    const { error } = await rpcUntyped("reject_withdrawal", {
      p_withdrawal_id: withdrawalId,
      p_reason: rejectReason.trim(),
    });

    setProcessing(false);

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao recusar",
        description: error.message,
      });
      return;
    }

    toast({
      title: "Saque recusado",
      description: "O saque foi recusado e o motivo foi registrado.",
    });

    setRejectOpen(false);
    navigate(dashboardPath);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!details) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground">Solicitação não encontrada</p>
        <Button variant="link" onClick={() => navigate(dashboardPath)}>
          Voltar à fila
        </Button>
      </div>
    );
  }

  const { withdrawal, member, financial_summary, transactions, commission_details } =
    details;

  const expectedBalance =
    financial_summary.total_credits - financial_summary.total_debits;
  const balanceMatches = Math.abs(expectedBalance - financial_summary.current_balance) < 0.01;

  const isPending = withdrawal.status === "pending";

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
        <Button variant="ghost" size="icon" onClick={() => navigate(dashboardPath)} className="shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-lg sm:text-xl font-bold">
          Auditoria #{withdrawal.id.slice(0, 8).toUpperCase()}
        </h1>
        <Badge
          variant={
            withdrawal.status === "approved"
              ? "default"
              : withdrawal.status === "rejected"
              ? "destructive"
              : "outline"
          }
        >
          {withdrawal.status === "approved"
            ? "Aprovado"
            : withdrawal.status === "rejected"
            ? "Recusado"
            : "Pendente"}
        </Badge>
      </div>

      {/* Member info */}
      <Card>
        <CardHeader className="px-3 sm:px-6 py-3 sm:py-4">
          <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Membro
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-3 sm:gap-4 px-3 sm:px-6">
          <Avatar className="h-12 w-12 sm:h-16 sm:w-16 shrink-0">
            <AvatarImage src={member.avatar_url || undefined} />
            <AvatarFallback>
              {(member.display_name || member.username || "?")
                .charAt(0)
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="font-medium text-sm sm:text-base truncate">
              {member.display_name || member.username || "Membro"}
            </div>
            {member.username && (
              <div className="text-xs sm:text-sm text-muted-foreground">{member.username?.startsWith("@") ? member.username : `@${member.username}`}</div>
            )}
            <div className="mt-1 text-xs sm:text-sm">
              <span className="text-muted-foreground">PIX: </span>
              <span className="font-mono break-all">{withdrawal.pix_key}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Withdrawal details */}
      <Card>
        <CardHeader className="px-3 sm:px-6 py-3 sm:py-4">
          <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Solicitação
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3 px-3 sm:px-6">
          <div>
            <div className="text-xs sm:text-sm text-muted-foreground">Valor Bruto</div>
            <div className="text-base sm:text-lg font-semibold">
              {formatCurrency(withdrawal.gross_amount)}
            </div>
          </div>
          <div>
            <div className="text-xs sm:text-sm text-muted-foreground">Taxa (4,99%)</div>
            <div className="text-base sm:text-lg font-semibold text-destructive">
              -{formatCurrency(withdrawal.fee_amount)}
            </div>
          </div>
          <div>
            <div className="text-xs sm:text-sm text-muted-foreground">Valor Líquido</div>
            <div className="text-base sm:text-lg font-semibold text-[hsl(var(--gold))]">
              {formatCurrency(withdrawal.net_amount)}
            </div>
          </div>
          <div className="sm:col-span-3">
            <div className="text-xs sm:text-sm text-muted-foreground">Solicitado em</div>
            <div className="text-sm">
              {format(new Date(withdrawal.requested_at), "dd/MM/yyyy 'às' HH:mm", {
                locale: ptBR,
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Math verification */}
      <Card className={balanceMatches ? "border-green-500/50" : "border-destructive"}>
        <CardHeader className="px-3 sm:px-6 py-3 sm:py-4">
          <CardTitle className="flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-muted-foreground">
            {balanceMatches ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-destructive" />
            )}
            Verificação Matemática
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-4 px-3 sm:px-6">
          <div>
            <div className="text-xs sm:text-sm text-muted-foreground">Total Entradas</div>
            <div className="text-sm sm:text-lg font-semibold text-green-500">
              +{formatCurrency(financial_summary.total_credits)}
            </div>
          </div>
          <div>
            <div className="text-xs sm:text-sm text-muted-foreground">Total Saídas</div>
            <div className="text-sm sm:text-lg font-semibold text-destructive">
              -{formatCurrency(financial_summary.total_debits)}
            </div>
          </div>
          <div>
            <div className="text-xs sm:text-sm text-muted-foreground">Saldo Esperado</div>
            <div className="text-sm sm:text-lg font-semibold">{formatCurrency(expectedBalance)}</div>
          </div>
          <div>
            <div className="text-xs sm:text-sm text-muted-foreground">Saldo Atual</div>
            <div className="text-sm sm:text-lg font-semibold">
              {formatCurrency(financial_summary.current_balance)}
              {balanceMatches && (
                <span className="ml-1 sm:ml-2 text-xs sm:text-sm text-green-500">[OK]</span>
              )}
            </div>
          </div>
          {financial_summary.pending_withdrawals > 0 && (
            <div className="col-span-2 sm:col-span-4">
              <div className="text-xs sm:text-sm text-muted-foreground">Pendente de Aprovação</div>
              <div className="text-sm sm:text-lg font-semibold text-amber-500">
                {formatCurrency(financial_summary.pending_withdrawals)}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction history */}
      <Card>
        <CardHeader className="px-3 sm:px-6 py-3 sm:py-4">
          <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Histórico Completo
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 sm:px-6">
          {!transactions || transactions.length === 0 ? (
            <p className="text-muted-foreground">Nenhuma transação registrada</p>
          ) : (
            <div className="max-h-64 space-y-2 overflow-auto">
              {transactions.map((t) => (
                <div
                  key={t.id}
                  className="flex items-start sm:items-center justify-between gap-2 rounded-md border border-border p-2 text-sm"
                >
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm truncate">{t.description}</div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground">
                      {format(new Date(t.created_at), "dd/MM/yyyy HH:mm", {
                        locale: ptBR,
                      })}
                    </div>
                  </div>
                  <div
                    className={`font-medium shrink-0 text-xs sm:text-sm ${
                      t.type === "credit" ? "text-green-500" : "text-destructive"
                    }`}
                  >
                    {t.type === "credit" ? "+" : "-"}
                    {formatCurrency(t.amount)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Commission sources */}
      {commission_details && commission_details.length > 0 && (
        <Card>
          <CardHeader className="px-3 sm:px-6 py-3 sm:py-4">
            <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Origem das Comissões
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            <div className="max-h-48 space-y-2 overflow-auto">
              {commission_details.map((c) => (
                <div
                  key={c.id}
                  className="flex items-start sm:items-center justify-between gap-2 rounded-md border border-border p-2 text-sm"
                >
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm truncate">{c.product_name}</div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground">
                      Nível {c.level} • {(c.commission_rate * 100).toFixed(2)}%
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-medium text-xs sm:text-sm">
                      {formatCurrency(c.sale_amount * c.commission_rate)}
                    </div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground">
                      Venda: {formatCurrency(c.sale_amount)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      {isPending && (
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="destructive"
            className="flex-1"
            onClick={() => setRejectOpen(true)}
            disabled={processing}
          >
            <XCircle className="mr-2 h-4 w-4" />
            Recusar
          </Button>
          <Button
            className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700"
            onClick={handleApprove}
            disabled={processing}
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            {processing ? "Processando..." : "Aprovar e Pagar"}
          </Button>
        </div>
      )}

      {/* Reject dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Recusar Solicitação</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Informe o motivo da recusa. Esta informação será registrada na auditoria
              e ficará visível para o membro.
            </p>
            <Textarea
              placeholder="Motivo da recusa..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setRejectOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectReason.trim() || processing}
            >
              {processing ? "Processando..." : "Confirmar Recusa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
