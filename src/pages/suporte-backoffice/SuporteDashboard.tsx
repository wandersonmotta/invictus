import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, CheckCircle2, Clock, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { isLovableHost } from "@/lib/appOrigin";
import { Skeleton } from "@/components/ui/skeleton";

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  escalated: { label: "Aguardando", color: "text-yellow-400" },
  assigned: { label: "Em atendimento", color: "text-blue-400" },
  resolved: { label: "Resolvido", color: "text-emerald-400" },
};

export default function SuporteDashboard() {
  const navigate = useNavigate();
  const basePath = isLovableHost(window.location.hostname) ? "/suporte-backoffice" : "";

  const { data: tickets, isLoading } = useQuery({
    queryKey: ["suporte-tickets-queue"],
    queryFn: async () => {
      const { data } = await supabase
        .from("support_tickets")
        .select("*, profiles!support_tickets_user_id_fkey(display_name, avatar_url)")
        .in("status", ["escalated", "assigned", "resolved"] as any)
        .order("updated_at", { ascending: false });
      return (data || []) as any[];
    },
    refetchInterval: 5000,
  });

  // Fallback: fetch profile separately if join fails
  const { data: ticketsWithProfiles } = useQuery({
    queryKey: ["suporte-tickets-profiles", tickets],
    enabled: !!tickets && tickets.length > 0,
    queryFn: async () => {
      const userIds = [...new Set(tickets!.map((t: any) => t.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", userIds);

      const profileMap: Record<string, any> = {};
      (profiles || []).forEach((p: any) => { profileMap[p.user_id] = p; });

      return tickets!.map((t: any) => ({
        ...t,
        profile: t.profiles || profileMap[t.user_id] || null,
      }));
    },
  });

  const displayTickets = ticketsWithProfiles || tickets || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Fila de Tickets</h1>
        <p className="text-sm text-muted-foreground">Tickets escalados aguardando atendimento</p>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      )}

      {!isLoading && displayTickets.length === 0 && (
        <div className="text-center py-16 text-muted-foreground text-sm">
          Nenhum ticket pendente no momento.
        </div>
      )}

      <div className="space-y-2">
        {displayTickets.map((ticket: any) => {
          const status = STATUS_MAP[ticket.status] || { label: ticket.status, color: "text-muted-foreground" };
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
                <p className="text-sm font-medium truncate">
                  {profile?.display_name || "Membro"}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {ticket.subject || `#${ticket.id.slice(0, 6)}`} · {new Date(ticket.updated_at).toLocaleDateString("pt-BR")}
                </p>
              </div>
              <span className={`text-xs font-medium ${status.color}`}>{status.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
