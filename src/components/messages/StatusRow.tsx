import * as React from "react";
import { Plus } from "lucide-react";

import { useAuth } from "@/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

export function StatusRow() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [text, setText] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const save = async () => {
    if (!user?.id) return;
    const t = text.trim();
    if (!t) {
      toast({ title: "Digite um status", description: "Ex.: Em reunião agora." });
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("member_status")
      .upsert({ user_id: user.id, status_text: t, expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() });
    setSaving(false);

    if (error) {
      toast({ title: "Não foi possível salvar", description: error.message });
      return;
    }

    toast({ title: "Status atualizado", description: "Válido por 24 horas." });
    setOpen(false);
  };

  return (
    <div className="flex items-center gap-3 overflow-x-auto">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-2 rounded-full border border-border/70 px-3 py-2 invictus-surface invictus-frame shrink-0"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-border/70">
              <Plus className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="text-sm font-medium">Seu status</span>
          </button>
        </DialogTrigger>

        <DialogContent className="border-0 bg-transparent p-0 shadow-none">
          <div className="invictus-modal-glass invictus-frame p-5">
            <DialogHeader className="mb-4">
              <DialogTitle>Status do dia</DialogTitle>
              <DialogDescription>Texto curto que expira em 24h.</DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Ex.: Em reunião. Respondo mais tarde." />
              <Button className="h-11 w-full" onClick={() => void save()} disabled={saving}>
                {saving ? "Salvando…" : "Salvar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="text-xs text-muted-foreground whitespace-nowrap">
        (Feed de status dos membros vem na próxima etapa.)
      </div>
    </div>
  );
}
