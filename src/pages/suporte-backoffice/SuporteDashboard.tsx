import { useState, useMemo, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { isLovableHost } from "@/lib/appOrigin";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/auth/AuthProvider";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useIsSuporteGerente } from "@/hooks/useIsSuporteGerente";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const PRIORITY_MAP: Record<string, { label: string; color: string; chipBg: string; order: number }> = {
  urgente: { label: "Urgente", color: "bg-red-500/20 text-red-400", chipBg: "bg-red-500/20 text-red-400 border-red-500/30", order: 0 },
  moderado: { label: "Moderado", color: "bg-yellow-500/20 text-yellow-400", chipBg: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", order: 1 },
  baixo: { label: "Baixo", color: "bg-emerald-500/20 text-emerald-400", chipBg: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", order: 2 },
};

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  escalated: { label: "Aguardando", color: "text-yellow-400" },
  assigned: { label: "Em atendimento", color: "text-blue-400" },
  resolved: { label: "Resolvido", color: "text-emerald-400" },
};

type PriorityFilter = "all" | "urgente" | "moderado" | "baixo";

function PriorityChips({ tickets, filter, onFilter }: { tickets: any[]; filter: PriorityFilter; onFilter: (f: PriorityFilter) => void }) {
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: tickets.length, urgente: 0, moderado: 0, baixo: 0 };
    tickets.forEach((t: any) => { if (c[t.priority] !== undefined) c[t.priority]++; });
    return c;
  }, [tickets]);

  const chips: { key: PriorityFilter; label: string; className: string }[] = [
    { key: "all", label: "Todos", className: "bg-muted text-muted-foreground border-border" },
    { key: "urgente", label: "Urgente", className: PRIORITY_MAP.urgente.chipBg },
    { key: "moderado", label: "Moderado", className: PRIORITY_MAP.moderado.chipBg },
    { key: "baixo", label: "Baixo", className: PRIORITY_MAP.baixo.chipBg },
  ];

  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar">
      {chips.map(({ key, label, className }) => (
        <button
          key={key}
          onClick={() => onFilter(key)}
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-all ${className} ${filter === key ? "ring-2 ring-primary/50 scale-105" : "opacity-70 hover:opacity-100"}`}
        >
          {label}
          <span className="tabular-nums">({counts[key]})</span>
        </button>
      ))}
    </div>
  );
}

function TicketList({ tickets, basePath }: { tickets: any[]; basePath: string }) {
  const navigate = useNavigate();
  if (tickets.length === 0) {
    return <div className="text-center py-16 text-muted-foreground text-sm">Nenhum ticket encontrado.</div>;
  }
  return (
    <div className="space-y-2">
      {tickets.map((ticket: any) => {
        const status = STATUS_MAP[ticket.status] || { label: ticket.status, color: "text-muted-foreground" };
        const priority = PRIORITY_MAP[ticket.priority] || PRIORITY_MAP.baixo;
        const profile = ticket.profile;
        return (
          <button
            key={ticket.id}
            onClick={() => navigate(`${basePath}/atendimento/${ticket.id}`)}
            className="w-full flex items-center gap-3 rounded-xl border border-border bg-card/50 p-4 text-left transition-colors hover:bg-accent/50"
          >
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover border border-border" />
            ) : (
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center border border-border">
                <User className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{profile?.display_name || "Membro"}</p>
              <p className="text-[11px] text-muted-foreground">
                {ticket.subject || `#${ticket.id.slice(0, 6)}`} · {new Date(ticket.updated_at).toLocaleDateString("pt-BR")}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${priority.color}`}>{priority.label}</span>
              <span className={`text-xs font-medium ${status.color}`}>{status.label}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

export default function SuporteDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: isAdmin } = useIsAdmin(user?.id);
  const { data: isGerente } = useIsSuporteGerente(user?.id);
  const isManager = isAdmin || isGerente;
  const basePath = isLovableHost(window.location.hostname) ? "/suporte-backoffice" : "";

  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");

  const { data: rawTickets, isLoading } = useQuery({
    queryKey: ["suporte-tickets-queue"],
    queryFn: async () => {
      const { data } = await supabase
        .from("support_tickets")
        .select("*")
        .in("status", ["escalated", "assigned", "resolved"] as any)
        .order("updated_at", { ascending: false });
      return (data || []) as any[];
    },
    refetchInterval: 5000,
  });

  const { data: displayTickets } = useQuery({
    queryKey: ["suporte-tickets-profiles", rawTickets?.map((t: any) => t.id)],
    enabled: !!rawTickets && rawTickets.length > 0,
    queryFn: async () => {
      const userIds = [...new Set(rawTickets!.map((t: any) => t.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", userIds);
      const profileMap: Record<string, any> = {};
      (profiles || []).forEach((p: any) => { profileMap[p.user_id] = p; });
      return rawTickets!.map((t: any) => ({ ...t, profile: profileMap[t.user_id] || null }));
    },
  });

  useEffect(() => {
    if (!isManager) return;
    const poll = async () => {
      try {
        const session = (await supabase.auth.getSession()).data.session;
        if (!session) return;
        await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/support-auto-redistribute`,
          { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` } }
        );
        queryClient.invalidateQueries({ queryKey: ["suporte-tickets-queue"] });
      } catch { /* silent */ }
    };
    const interval = setInterval(poll, 60_000);
    return () => clearInterval(interval);
  }, [isManager, queryClient]);

  const allTickets = displayTickets || rawTickets || [];

  const { pendingTickets, resolvedTickets } = useMemo(() => {
    const pending: any[] = [];
    const resolved: any[] = [];
    allTickets.forEach((t: any) => {
      if (t.status === "resolved") resolved.push(t);
      else pending.push(t);
    });
    const sort = (arr: any[]) => arr.sort((a: any, b: any) => {
      const pa = PRIORITY_MAP[a.priority]?.order ?? 3;
      const pb = PRIORITY_MAP[b.priority]?.order ?? 3;
      if (pa !== pb) return pa - pb;
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });
    return { pendingTickets: sort(pending), resolvedTickets: sort(resolved) };
  }, [allTickets]);

  const applyFilter = (tickets: any[]) =>
    priorityFilter === "all" ? tickets : tickets.filter((t: any) => t.priority === priorityFilter);

  return (
    <div className="space-y-4 pb-24">
      <div>
        <h1 className="text-xl font-bold">Fila de Tickets</h1>
        <p className="text-sm text-muted-foreground">Tickets escalados aguardando atendimento</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
      ) : (
        <Tabs defaultValue="pending" onValueChange={() => setPriorityFilter("all")}>
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="pending">Pendentes</TabsTrigger>
            <TabsTrigger value="resolved">Resolvidos</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            <PriorityChips tickets={pendingTickets} filter={priorityFilter} onFilter={setPriorityFilter} />
            <TicketList tickets={applyFilter(pendingTickets)} basePath={basePath} />
          </TabsContent>

          <TabsContent value="resolved" className="space-y-4">
            <PriorityChips tickets={resolvedTickets} filter={priorityFilter} onFilter={setPriorityFilter} />
            <TicketList tickets={applyFilter(resolvedTickets)} basePath={basePath} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
