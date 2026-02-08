import { useState } from "react";
import { Star } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticketId: string;
  userId: string;
  agentId: string | null;
}

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="p-0.5 transition-transform hover:scale-110"
        >
          <Star
            className={cn(
              "h-7 w-7 transition-colors",
              star <= value ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"
            )}
          />
        </button>
      ))}
    </div>
  );
}

export function SupportRatingDialog({ open, onOpenChange, ticketId, userId, agentId }: Props) {
  const [ratingResolved, setRatingResolved] = useState(0);
  const [ratingAgent, setRatingAgent] = useState(0);
  const [saving, setSaving] = useState(false);

  const canSubmit = ratingResolved > 0 && ratingAgent > 0;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSaving(true);
    try {
      const { error } = await (supabase as any).from("support_ratings").insert({
        ticket_id: ticketId,
        user_id: userId,
        agent_id: agentId,
        rating_resolved: ratingResolved,
        rating_agent: ratingAgent,
      });
      if (error) {
        if (error.code === "23505") {
          toast.info("Você já avaliou este atendimento.");
        } else {
          throw error;
        }
      } else {
        toast.success("Avaliação enviada! Obrigado.");
      }
      onOpenChange(false);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao enviar avaliação.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Avalie o atendimento</DialogTitle>
          <DialogDescription>Sua opinião nos ajuda a melhorar.</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="space-y-2">
            <p className="text-sm font-medium">O seu problema foi solucionado?</p>
            <StarRating value={ratingResolved} onChange={setRatingResolved} />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">O atendente foi cordial e ajudou a resolver?</p>
            <StarRating value={ratingAgent} onChange={setRatingAgent} />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
            Pular
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit || saving}>
            {saving ? "Enviando..." : "Enviar avaliação"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
