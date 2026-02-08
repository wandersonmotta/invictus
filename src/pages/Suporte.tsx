import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { Plus, MessageCircle, CheckCircle2, AlertTriangle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { SupportChatView } from "@/components/suporte/SupportChatView";
import { toast } from "sonner";

const STATUS_MAP: Record<string, { label: string; icon: typeof Clock; color: string }> = {
  ai_handling: { label: "IA", icon: MessageCircle, color: "text-primary" },
  escalated: { label: "Aguardando", icon: AlertTriangle, color: "text-yellow-400" },
  assigned: { label: "Em atendimento", icon: Clock, color: "text-blue-400" },
  resolved: { label: "Resolvido", icon: CheckCircle2, color: "text-emerald-400" },
  open: { label: "Aberto", icon: Clock, color: "text-muted-foreground" },
};

export default function Suporte() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);

  const { data: tickets, refetch } = useQuery({
    queryKey: ["support-tickets", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("support_tickets")
        .select("*")
        .eq("user_id", user!.id)
        .order("updated_at", { ascending: false });
      return (data || []) as any[];
    },
  });

  // If a ticketId is in the URL, show the chat view
  if (ticketId) {
    return <SupportChatView ticketId={ticketId} />;
  }

  const handleNewTicket = async () => {
    if (creating) return;
    setCreating(true);
    try {
      const { data, error } = await supabase
        .from("support_tickets")
        .insert({ user_id: user!.id, status: "ai_handling" } as any)
        .select("id")
        .single();
      if (error) throw error;
      refetch();
      navigate(`/suporte/${data.id}`);
    } catch (e: any) {
      toast.error("Erro ao criar ticket");
      console.error(e);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Suporte</h1>
          <p className="text-sm text-muted-foreground">Tire suas dúvidas com nosso assistente</p>
        </div>
        <Button onClick={handleNewTicket} disabled={creating} className="gap-2">
          <Plus className="h-4 w-4" />
          Iniciar chat
        </Button>
      </div>

      {/* Ticket list */}
      <div className="space-y-2">
        {(!tickets || tickets.length === 0) && (
          <div className="text-center py-12 text-muted-foreground text-sm">
            Nenhum atendimento ainda. Clique em "Iniciar chat" para começar.
          </div>
        )}
        {tickets?.map((ticket: any) => {
          const status = STATUS_MAP[ticket.status] || STATUS_MAP.open;
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
