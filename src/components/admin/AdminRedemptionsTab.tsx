import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { rpcUntyped } from "@/lib/rpc";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Redemption {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  reward_name: string;
  points_spent: number;
  status: "pending" | "approved" | "rejected" | "delivered";
  requested_at: string;
  reviewed_at: string | null;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: "Pendente", className: "bg-yellow-600/20 text-yellow-400 border-yellow-600/30" },
  approved: { label: "Aprovado", className: "bg-green-600/20 text-green-400 border-green-600/30" },
  rejected: { label: "Rejeitado", className: "bg-destructive/20 text-destructive border-destructive/30" },
  delivered: { label: "Entregue", className: "bg-blue-600/20 text-blue-400 border-blue-600/30" },
};

export function AdminRedemptionsTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [updating, setUpdating] = React.useState<string | null>(null);

  const { data: redemptions, isLoading } = useQuery({
    queryKey: ["admin_redemptions"],
    queryFn: async () => {
      const { data, error } = await rpcUntyped<Redemption[]>("admin_list_redemptions", { p_limit: 200 });
      if (error) throw error;
      return (data ?? []) as Redemption[];
    },
  });

  const updateStatus = async (redemptionId: string, status: string) => {
    setUpdating(redemptionId);
    try {
      const { error } = await rpcUntyped("admin_update_redemption_status", {
        p_redemption_id: redemptionId,
        p_status: status,
      });
      if (error) throw error;
      toast({ title: `Status atualizado para "${statusConfig[status]?.label ?? status}"` });
      await qc.invalidateQueries({ queryKey: ["admin_redemptions"] });
    } catch (e: any) {
      toast({ title: "Erro ao atualizar status", description: e?.message ?? String(e), variant: "destructive" });
    } finally {
      setUpdating(null);
    }
  };

  return (
    <Card className="invictus-surface invictus-frame border-border/70">
      <CardHeader>
        <CardTitle className="text-base">Resgates de prêmios</CardTitle>
        <CardDescription>Gerencie os pedidos de resgate dos membros.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : (redemptions ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum resgate solicitado.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Membro</TableHead>
                <TableHead>Prêmio</TableHead>
                <TableHead>Pontos</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(redemptions ?? []).map((r) => {
                const initials = (r.display_name ?? "?")
                  .split(" ")
                  .map((w) => w[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase();
                const cfg = statusConfig[r.status] ?? statusConfig.pending;
                const isBusy = updating === r.id;

                return (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={r.avatar_url ?? undefined} alt={r.display_name ?? ""} />
                          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{r.display_name ?? "—"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{r.reward_name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {r.points_spent.toLocaleString("pt-BR")}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(r.requested_at).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cfg.className}>
                        {cfg.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex gap-1">
                        {r.status === "pending" && (
                          <>
                            <Button size="sm" variant="outline" disabled={isBusy} onClick={() => void updateStatus(r.id, "approved")}>
                              Aprovar
                            </Button>
                            <Button size="sm" variant="destructive" disabled={isBusy} onClick={() => void updateStatus(r.id, "rejected")}>
                              Rejeitar
                            </Button>
                          </>
                        )}
                        {r.status === "approved" && (
                          <Button size="sm" variant="outline" disabled={isBusy} onClick={() => void updateStatus(r.id, "delivered")}>
                            Entregue
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
