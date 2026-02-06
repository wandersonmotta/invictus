import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { rpcUntyped } from "@/lib/rpc";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, Eye } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PendingWithdrawal {
  withdrawal_id: string;
  user_id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  gross_amount: number;
  fee_amount: number;
  net_amount: number;
  pix_key: string;
  requested_at: string;
  current_balance: number;
}

export default function FinanceiroDashboard() {
  const navigate = useNavigate();
  const [withdrawals, setWithdrawals] = useState<PendingWithdrawal[]>([]);
  const [loading, setLoading] = useState(true);

  const isPreview = window.location.hostname.endsWith(".lovable.app") || window.location.hostname.endsWith(".lovableproject.com");
  const auditPath = isPreview ? "/financeiro/auditoria" : "/auditoria";

  const fetchQueue = async () => {
    setLoading(true);
    const { data, error } = await rpcUntyped<PendingWithdrawal[]>(
      "list_pending_withdrawals",
      { p_limit: 100 }
    );
    if (!error && data) {
      setWithdrawals(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold">Fila de Auditoria</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {withdrawals.length} solicitação(ões) pendente(s)
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchQueue} disabled={loading} className="shrink-0">
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">Atualizar</span>
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : withdrawals.length === 0 ? (
        <Card>
          <CardContent className="flex h-40 items-center justify-center">
            <p className="text-muted-foreground">Nenhuma solicitação pendente</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {withdrawals.map((w) => (
            <Card
              key={w.withdrawal_id}
              className="cursor-pointer transition-colors hover:bg-accent/50"
              onClick={() => navigate(`${auditPath}/${w.withdrawal_id}`)}
            >
              <CardContent className="p-3 sm:p-4">
                {/* Mobile: stacked layout / Desktop: horizontal */}
                <div className="flex items-start gap-3 sm:items-center sm:gap-4">
                  <Avatar className="h-10 w-10 sm:h-12 sm:w-12 shrink-0">
                    <AvatarImage src={w.avatar_url || undefined} />
                    <AvatarFallback>
                      {(w.display_name || w.username || "?").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium truncate text-sm sm:text-base">
                        {w.display_name || w.username || "Membro"}
                      </span>
                      {w.username && (
                        <span className="text-xs sm:text-sm text-muted-foreground">
                          {w.username.startsWith("@") ? w.username : `@${w.username}`}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-2 text-xs sm:text-sm text-muted-foreground">
                      <span className="truncate max-w-[140px] sm:max-w-none">PIX: {w.pix_key}</span>
                      <span className="hidden sm:inline">•</span>
                      <span>
                        {format(new Date(w.requested_at), "dd/MM/yyyy HH:mm", {
                          locale: ptBR,
                        })}
                      </span>
                    </div>

                    {/* Mobile: value + badge inline below info */}
                    <div className="mt-2 flex items-center justify-between gap-2 sm:hidden">
                      <span className="text-base font-semibold text-[hsl(var(--gold))]">
                        {formatCurrency(w.net_amount)}
                      </span>
                      <Badge variant="outline" className="shrink-0">Pendente</Badge>
                    </div>
                  </div>

                  {/* Desktop: value + badge + icon on right */}
                  <div className="hidden sm:flex sm:items-center sm:gap-3">
                    <div className="text-right">
                      <div className="text-lg font-semibold text-[hsl(var(--gold))]">
                        {formatCurrency(w.net_amount)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Bruto: {formatCurrency(w.gross_amount)}
                      </div>
                    </div>
                    <Badge variant="outline">Pendente</Badge>
                    <Button variant="ghost" size="icon" className="shrink-0">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
