import { useEffect, useState, useMemo } from "react";
import { rpcUntyped } from "@/lib/rpc";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RefreshCw, Wallet, Search, Users } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface MemberBalance {
  user_id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  balance: number;
  last_credit_at: string | null;
}

export default function FinanceiroCarteira() {
  const [members, setMembers] = useState<MemberBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchBalances = async () => {
    setLoading(true);
    const { data, error } = await rpcUntyped<MemberBalance[]>("list_all_member_balances");
    if (!error && data) setMembers(data);
    setLoading(false);
  };

  useEffect(() => { fetchBalances(); }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return members;
    const q = search.toLowerCase();
    return members.filter(
      (m) =>
        (m.display_name || "").toLowerCase().includes(q) ||
        (m.username || "").toLowerCase().includes(q)
    );
  }, [members, search]);

  const totalBalance = useMemo(
    () => members.reduce((sum, m) => sum + Number(m.balance), 0),
    [members]
  );

  const fmt = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Carteira de Bônus</h1>
          <p className="text-sm text-muted-foreground">
            Visão consolidada dos saldos disponíveis
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchBalances} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Wallet className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Disponível</p>
              {loading ? (
                <Skeleton className="mt-1 h-7 w-32" />
              ) : (
                <p className="text-2xl font-bold text-[hsl(var(--gold))]">{fmt(totalBalance)}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Membros com Saldo</p>
              {loading ? (
                <Skeleton className="mt-1 h-7 w-16" />
              ) : (
                <p className="text-2xl font-bold">{members.length}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou username..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Member list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex h-40 flex-col items-center justify-center gap-2">
            <Wallet className="h-8 w-8 text-muted-foreground" />
            <p className="text-muted-foreground">
              {search ? "Nenhum membro encontrado" : "Nenhum saldo disponível"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((m) => (
            <Card key={m.user_id}>
              <CardContent className="flex items-center gap-4 p-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={m.avatar_url || undefined} />
                  <AvatarFallback>
                    {(m.display_name || m.username || "?").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">
                      {m.display_name || m.username || "Membro"}
                    </span>
                    {m.username && (
                      <span className="text-sm text-muted-foreground">
                        {m.username.startsWith("@") ? m.username : `@${m.username}`}
                      </span>
                    )}
                  </div>
                  {m.last_credit_at && (
                    <p className="text-xs text-muted-foreground">
                      Último crédito:{" "}
                      {format(new Date(m.last_credit_at), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  )}
                </div>

                <div className="text-right shrink-0">
                  <span className="text-lg font-semibold text-[hsl(var(--gold))]">
                    {fmt(Number(m.balance))}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
