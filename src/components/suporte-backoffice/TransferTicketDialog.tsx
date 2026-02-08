import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { User, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Agent {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  is_gerente: boolean;
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

  const available = agents.filter((a) => a.user_id !== currentAssignedTo);

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Transferir Ticket</DialogTitle>
        </DialogHeader>
        {available.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Nenhum outro atendente disponível.</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {available.map((agent) => (
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
                <span className="text-sm font-medium truncate">{agent.display_name || "Sem nome"}</span>
                {transferring === agent.user_id && <Loader2 className="h-4 w-4 animate-spin ml-auto" />}
              </Button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
