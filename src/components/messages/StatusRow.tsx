import * as React from "react";
import { Plus } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { StatusFeed } from "./StatusFeed";

export function StatusRow() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
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
    setText("");
    qc.invalidateQueries({ queryKey: ["mutual_statuses"] });
  };

  return (
    <div className="flex items-center gap-3 overflow-x-auto">
      {/* Botão para adicionar/editar status */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <button
            type="button"
            className="flex flex-col items-center gap-1 shrink-0 transition-transform hover:scale-105"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-dashed border-border/70 bg-muted/10">
              <Plus className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            </span>
            <span className="text-[10px] text-muted-foreground">Status</span>
          </button>
        </DialogTrigger>

        <DialogContent className="border-0 bg-transparent p-0 shadow-none">
          <div className="invictus-modal-glass invictus-frame p-5">
            <DialogHeader className="mb-4">
              <DialogTitle>Status do dia</DialogTitle>
              <DialogDescription>Texto curto visível para conexões mútuas. Expira em 24h.</DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <Input 
                value={text} 
                onChange={(e) => setText(e.target.value)} 
                placeholder="Ex.: Em reunião. Respondo mais tarde."
                maxLength={200}
              />
              <Button className="h-11 w-full" onClick={() => void save()} disabled={saving}>
                {saving ? "Salvando…" : "Salvar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Feed de status de conexões mútuas */}
      <StatusFeed />
    </div>
  );
}
