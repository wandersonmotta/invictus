import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface AddNomeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddNomeDialog({ open, onOpenChange }: AddNomeDialogProps) {
  const [personName, setPersonName] = useState("");
  const [document, setDocument] = useState("");
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const trimmedName = personName.trim();
      if (!trimmedName || trimmedName.length < 2 || trimmedName.length > 200) {
        throw new Error("Nome inválido");
      }

      const { error } = await supabase
        .from("limpa_nome_requests" as any)
        .insert({
          user_id: user.id,
          person_name: trimmedName,
          document: document.trim() || null,
        } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Nome adicionado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["limpa-nome-requests"] });
      setPersonName("");
      setDocument("");
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Erro ao adicionar nome.");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Adicionar Nome</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="person-name">Nome completo</Label>
            <Input
              id="person-name"
              placeholder="Ex: João da Silva"
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
              maxLength={200}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="document">CPF / Documento (opcional)</Label>
            <Input
              id="document"
              placeholder="000.000.000-00"
              value={document}
              onChange={(e) => setDocument(e.target.value)}
              maxLength={20}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={() => mutation.mutate()}
            disabled={!personName.trim() || mutation.isPending}
            className="w-full"
          >
            {mutation.isPending ? "Enviando..." : "Enviar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
