import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { User, Loader2, Circle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Agent {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  is_gerente: boolean;
}

interface AgentPresence {
  user_id: string;
  status: string;
  last_heartbeat: string;
  active_ticket_count: number;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticketId: string;
  currentAssignedTo: string | null;
  agents: Agent[];
  onTransferred: () => void;
}

export function TransferTicketDialog({ open, onOpenChange, ticketId, currentAssignedTo, agents, onTransferred }: Props) {
  const [transferring, setTransferring] = useState<string | null>(null);
  const [presence, setPresence] = useState<Record<string, AgentPresence>>({});

  const available = agents.filter((a) => a.user_id !== currentAssignedTo);

  // Fetch presence data
  useEffect(() => {
    if (!open || available.length === 0) return;

    const fetchPresence = async () => {
      const { data } = await supabase
        .from("support_agent_presence" as any)
        .select("*")
        .in("user_id", available.map((a) => a.user_id));

      const map: Record<string, AgentPresence> = {};
      (data || []).forEach((p: any) => { map[p.user_id] = p; });
      setPresence(map);
    };

    fetchPresence();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("agent-presence-transfer")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "support_agent_presence" },
        () => fetchPresence()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [open, available.length]);

  const getStatus = (agentId: string) => {
    const p = presence[agentId];
    if (!p) return { label: "Offline", color: "text-muted-foreground", dot: "bg-muted-foreground" };
    const isOnline = new Date(p.last_heartbeat).getTime() > Date.now() - 60_000;
    if (!isOnline) return { label: "Offline", color: "text-muted-foreground", dot: "bg-muted-foreground" };
    if (p.active_ticket_count > 0) return { label: `Em atendimento (${p.active_ticket_count})`, color: "text-yellow-400", dot: "bg-yellow-400" };
    return { label: "Online", color: "text-emerald-400", dot: "bg-emerald-400" };
  };

  const handleTransfer = async (targetAgent: Agent) => {
    setTransferring(targetAgent.user_id);
    try {
      const { error } = await supabase
        .from("support_tickets")
        .update({ assigned_to: targetAgent.user_id, status: "escalated" } as any)
        .eq("id", ticketId);

      if (error) throw error;

      // Insert system message
      await supabase.from("support_messages").insert({
        ticket_id: ticketId,
        sender_type: "ai",
        body: `🔄 Ticket transferido para ${targetAgent.display_name || "outro atendente"}.`,
      } as any);

      toast.success(`Ticket transferido para ${targetAgent.display_name}`);
      onTransferred();
      onOpenChange(false);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao transferir ticket");
    } finally {
      setTransferring(null);
    }
  };

  // Sort: online first, then by active tickets ascending
  const sortedAgents = [...available].sort((a, b) => {
    const sa = getStatus(a.user_id);
    const sb = getStatus(b.user_id);
    const onlineA = sa.label !== "Offline" ? 0 : 1;
    const onlineB = sb.label !== "Offline" ? 0 : 1;
    if (onlineA !== onlineB) return onlineA - onlineB;
    return (presence[a.user_id]?.active_ticket_count || 0) - (presence[b.user_id]?.active_ticket_count || 0);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Transferir Ticket</DialogTitle>
        </DialogHeader>
        {sortedAgents.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Nenhum outro atendente disponível.</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {sortedAgents.map((agent) => {
              const status = getStatus(agent.user_id);
              return (
                <Button
                  key={agent.user_id}
                  variant="ghost"
                  className="w-full justify-start gap-3 h-auto py-3"
                  disabled={transferring !== null}
                  onClick={() => handleTransfer(agent)}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={agent.avatar_url || undefined} />
                    <AvatarFallback><User className="h-3.5 w-3.5" /></AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start flex-1 min-w-0">
                    <span className="text-sm font-medium truncate">{agent.display_name || "Sem nome"}</span>
                    <span className={`text-[10px] flex items-center gap-1 ${status.color}`}>
                      <span className={`inline-block h-1.5 w-1.5 rounded-full ${status.dot}`} />
                      {status.label}
                    </span>
                  </div>
                  {transferring === agent.user_id && <Loader2 className="h-4 w-4 animate-spin ml-auto" />}
                </Button>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
