import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Brain } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface TrainingEntry {
  id: string;
  title: string;
  content: string;
  category: string;
  active: boolean;
  created_at: string;
}

const CATEGORIES = ["geral", "plataforma", "servicos", "planos", "pagamentos", "comunidade", "leads"];

export default function SuporteIATreinamento() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TrainingEntry | null>(null);
  const [form, setForm] = useState({ title: "", content: "", category: "geral" });

  const { data: entries, isLoading } = useQuery({
    queryKey: ["ai-training-entries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_training_entries")
        .select("*")
        .order("category")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as TrainingEntry[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (entry: { id?: string; title: string; content: string; category: string }) => {
      if (entry.id) {
        const { error } = await supabase
          .from("ai_training_entries")
          .update({ title: entry.title, content: entry.content, category: entry.category } as any)
          .eq("id", entry.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("ai_training_entries")
          .insert({ title: entry.title, content: entry.content, category: entry.category, created_by: user?.id } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-training-entries"] });
      setDialogOpen(false);
      setEditing(null);
      setForm({ title: "", content: "", category: "geral" });
      toast.success("Treinamento salvo!");
    },
    onError: () => toast.error("Erro ao salvar treinamento"),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase
        .from("ai_training_entries")
        .update({ active } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ai-training-entries"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ai_training_entries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-training-entries"] });
      toast.success("Treinamento removido!");
    },
    onError: () => toast.error("Erro ao remover"),
  });

  const openNew = () => {
    setEditing(null);
    setForm({ title: "", content: "", category: "geral" });
    setDialogOpen(true);
  };

  const openEdit = (entry: TrainingEntry) => {
    setEditing(entry);
    setForm({ title: entry.title, content: entry.content, category: entry.category });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast.error("Preencha título e conteúdo");
      return;
    }
    saveMutation.mutate({ id: editing?.id, ...form });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Treinamento da IA
          </h1>
          <p className="text-sm text-muted-foreground">
            Base de conhecimento usada pelo assistente virtual
          </p>
        </div>
        <Button onClick={openNew} className="gap-2">
          <Plus className="h-4 w-4" />
          Adicionar
        </Button>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}

      {!isLoading && (!entries || entries.length === 0) && (
        <div className="text-center py-12 text-muted-foreground text-sm">
          Nenhum treinamento cadastrado. Adicione conteúdo para melhorar as respostas da IA.
        </div>
      )}

      <div className="space-y-2">
        {entries?.map((entry) => (
          <div
            key={entry.id}
            className={`flex items-start gap-3 rounded-xl border border-border p-4 transition-colors ${entry.active ? "bg-card/50" : "bg-muted/20 opacity-60"}`}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-medium">{entry.title}</p>
                <Badge variant="outline" className="text-[10px]">{entry.category}</Badge>
                {!entry.active && <Badge variant="secondary" className="text-[10px]">Inativo</Badge>}
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">{entry.content}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => toggleMutation.mutate({ id: entry.id, active: !entry.active })}
                title={entry.active ? "Desativar" : "Ativar"}
              >
                {entry.active ? <ToggleRight className="h-4 w-4 text-emerald-500" /> : <ToggleLeft className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(entry)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive"
                onClick={() => deleteMutation.mutate(entry.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Treinamento" : "Novo Treinamento"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Título</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="Ex: Como funciona o sistema de pontos"
              />
            </div>
            <div>
              <Label>Categoria</Label>
              <Select value={form.category} onValueChange={(v) => setForm((p) => ({ ...p, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Conteúdo</Label>
              <Textarea
                value={form.content}
                onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
                placeholder="Instruções detalhadas para a IA sobre este assunto..."
                rows={8}
                className="resize-y"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
