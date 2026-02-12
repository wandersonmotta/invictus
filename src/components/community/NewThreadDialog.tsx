import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

type Props = {
  channelId: string | null;
  onCreated?: (threadId: string) => void;
};

export function NewThreadDialog({ channelId, onCreated }: Props) {
  const qc = useQueryClient();
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!channelId) throw new Error("Selecione um canal");
      const cleanTitle = title.trim();
      if (!cleanTitle) throw new Error("O título é obrigatório");

      const { data, error } = await supabase.rpc("create_community_thread", {
        p_channel_id: channelId,
        p_title: cleanTitle,
        p_body: body || null,
      });
      if (error) throw error;
      return data as string;
    },
    onError: (err: any) => {
      let msg = "Não foi possível criar o tema.";
      
      const errMsg = err?.message || "";

      if (errMsg.includes("inadequado") || errMsg.includes("palavras inadequadas")) {
        msg = "O título ou mensagem contém palavras não permitidas.";
      } else if (errMsg.includes("unaccent")) {
        msg = "O sistema de filtro de palavras precisa de uma atualização no banco de dados. Contate o suporte técnico.";
        console.error("ERRO CRÍTICO: Extensão 'unaccent' faltando. Execute: npx supabase migration up");
      } else if (errMsg) {
        msg = errMsg;
      }
      
      toast({ title: "Erro", description: msg, variant: "destructive" });
    },
    onSuccess: async (threadId) => {
      await qc.invalidateQueries({ queryKey: ["community", "threads"] });
      setOpen(false);
      setTitle("");
      setBody("");
      onCreated?.(threadId);
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" disabled={!channelId}>
          Novo tema
        </Button>
      </DialogTrigger>
      <DialogContent className="invictus-surface invictus-frame border-border/70">
        <DialogHeader>
          <DialogTitle>Criar novo tema</DialogTitle>
        </DialogHeader>

        <div className="grid gap-3">
          <div className="grid gap-2">
            <Label htmlFor="thread-title">Título</Label>
            <Input
              id="thread-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex.: Como organizar a rotina da semana?"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="thread-body">Mensagem inicial (opcional)</Label>
            <Textarea
              id="thread-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Contexto, detalhes, links…"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending || !channelId || !title.trim()}
          >
            {createMutation.isPending ? "Criando…" : "Criar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
