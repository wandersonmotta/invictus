import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { rpcUntyped } from "@/lib/rpc";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { RefreshCw, Eye, FileText } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type StatusFilter = "all" | "approved" | "rejected";

interface ProcessedWithdrawal {
  withdrawal_id: string;
  user_id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  gross_amount: number;
  fee_amount: number;
  net_amount: number;
  pix_key: string;
  status: string;
  requested_at: string;
  reviewed_at: string | null;
  rejection_reason: string | null;
  reviewer_display_name: string | null;
  reviewer_username: string | null;
}

export default function FinanceiroHistorico() {
  const navigate = useNavigate();
  const [withdrawals, setWithdrawals] = useState<ProcessedWithdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>("all");

  const isPreview =
    window.location.hostname.endsWith(".lovable.app") ||
    window.location.hostname.endsWith(".lovableproject.com");
  const auditPath = isPreview ? "/financeiro/auditoria" : "/auditoria";

  const fetchHistory = async () => {
    setLoading(true);
    const { data, error } = await rpcUntyped<ProcessedWithdrawal[]>(
      "list_processed_withdrawals",
      { p_limit: 200 }
    );
    if (!error && data) {
      setWithdrawals(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const filtered =
    filter === "all"
      ? withdrawals
      : withdrawals.filter((w) => w.status === filter);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  const reviewerLabel = (w: ProcessedWithdrawal) => {
    const name = w.reviewer_display_name || w.reviewer_username;
    if (!name) return null;
    const prefix = w.status === "approved" ? "Aprovado por" : "Recusado por";
    return `${prefix} ${name}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Histórico de Auditorias</h1>
          <p className="text-sm text-muted-foreground">
            {filtered.length} registro(s)
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchHistory} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      <ToggleGroup
        type="single"
        value={filter}
        onValueChange={(v) => v && setFilter(v as StatusFilter)}
        variant="outline"
        className="justify-start"
      >
        <ToggleGroupItem value="all" className="text-xs">Todos</ToggleGroupItem>
        <ToggleGroupItem value="approved" className="text-xs">Aprovados</ToggleGroupItem>
        <ToggleGroupItem value="rejected" className="text-xs">Recusados</ToggleGroupItem>
      </ToggleGroup>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex h-40 flex-col items-center justify-center gap-2">
            <FileText className="h-8 w-8 text-muted-foreground" />
            <p className="text-muted-foreground">Nenhum registro encontrado</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((w) => {
            const isApproved = w.status === "approved";
            const reviewer = reviewerLabel(w);

            return (
              <Card
                key={w.withdrawal_id}
                className="cursor-pointer transition-colors hover:bg-accent/50"
                onClick={() => navigate(`${auditPath}/${w.withdrawal_id}`)}
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={w.avatar_url || undefined} />
                    <AvatarFallback>
                      {(w.display_name || w.username || "?")
                        .charAt(0)
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">
                        {w.display_name || w.username || "Membro"}
                      </span>
                      {w.username && (
                        <span className="text-sm text-muted-foreground">
                          {w.username.startsWith("@") ? w.username : `@${w.username}`}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-2 text-sm text-muted-foreground">
                      {w.reviewed_at && (
                        <span>
                          {format(new Date(w.reviewed_at), "dd/MM/yyyy HH:mm", {
                            locale: ptBR,
                          })}
                        </span>
                      )}
                      {reviewer && <span>· {reviewer}</span>}
                    </div>
                    {!isApproved && w.rejection_reason && (
                      <p className="mt-1 text-xs text-destructive line-clamp-1">
                        Motivo: {w.rejection_reason}
                      </p>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-lg font-semibold text-[hsl(var(--gold))]">
                      {formatCurrency(w.net_amount)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Bruto: {formatCurrency(w.gross_amount)}
                    </div>
                  </div>

                  <Badge
                    className={
                      isApproved
                        ? "border-green-500/50 bg-green-500/10 text-green-500"
                        : "border-destructive/50 bg-destructive/10 text-destructive"
                    }
                    variant="outline"
                  >
                    {isApproved ? "Aprovado" : "Recusado"}
                  </Badge>

                  <Button variant="ghost" size="icon" className="shrink-0">
                    <Eye className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
