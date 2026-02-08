import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, AlertTriangle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/AuthProvider";
import { SupportChatView } from "@/components/suporte/SupportChatView";

const STATUS_MAP: Record<string, { label: string; icon: typeof Clock; color: string }> = {
  escalated: { label: "Aguardando atendente", icon: AlertTriangle, color: "text-yellow-400" },
  assigned: { label: "Em atendimento", icon: Clock, color: "text-blue-400" },
  resolved: { label: "Resolvido", icon: CheckCircle2, color: "text-emerald-400" },
};

export default function Suporte() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: tickets } = useQuery({
    queryKey: ["support-tickets", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("support_tickets")
        .select("*")
        .eq("user_id", user!.id)
        .in("status", ["escalated", "assigned", "resolved"] as any)
        .order("updated_at", { ascending: false });
      return (data || []) as any[];
    },
  });

  if (ticketId) {
    return <SupportChatView ticketId={ticketId} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Suporte</h1>
        <p className="text-sm text-muted-foreground">Seus atendimentos com a equipe</p>
      </div>

      <div className="space-y-2">
        {(!tickets || tickets.length === 0) && (
          <div className="text-center py-12 text-muted-foreground text-sm">
            Nenhum atendimento registrado.
          </div>
        )}
        {tickets?.map((ticket: any) => {
          const status = STATUS_MAP[ticket.status] || STATUS_MAP.escalated;
          const StatusIcon = status.icon;
          return (
            <button
              key={ticket.id}
              onClick={() => navigate(`/suporte/${ticket.id}`)}
              className="w-full flex items-center gap-3 rounded-xl border border-border bg-card/50 p-4 text-left transition-colors hover:bg-accent/50"
            >
              <StatusIcon className={`h-5 w-5 shrink-0 ${status.color}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {ticket.subject || `Atendimento #${ticket.id.slice(0, 6)}`}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {new Date(ticket.created_at).toLocaleDateString("pt-BR")} · {status.label}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
