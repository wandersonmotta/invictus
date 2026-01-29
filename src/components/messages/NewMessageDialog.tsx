import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Send } from "lucide-react";

import { useAuth } from "@/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

type MemberRow = { user_id: string; display_name: string; avatar_url: string | null };

export function NewMessageDialog({
  open,
  onOpenChange,
  onConversationCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConversationCreated: (conversationId: string) => void;
}) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [q, setQ] = React.useState("");
  const [selected, setSelected] = React.useState<Record<string, boolean>>({});
  const [groupName, setGroupName] = React.useState("");
  const [creating, setCreating] = React.useState(false);

  const membersQuery = useQuery({
    queryKey: ["search_approved_members", q],
    enabled: open,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("search_approved_members", { p_search: q, p_limit: 30 });
      if (error) throw error;
      return (data ?? []) as MemberRow[];
    },
    staleTime: 10_000,
  });

  const selectedIds = React.useMemo(() => Object.entries(selected).filter(([, v]) => v).map(([k]) => k), [selected]);
  const isGroup = selectedIds.length >= 2;

  React.useEffect(() => {
    if (!open) {
      setQ("");
      setSelected({});
      setGroupName("");
      setCreating(false);
    }
  }, [open]);

  const toggle = (id: string) => {
    setSelected((s) => ({ ...s, [id]: !s[id] }));
  };

  const create = async () => {
    if (!user?.id) return;
    if (selectedIds.length < 1) {
      toast({ title: "Selecione alguém", description: "Escolha pelo menos 1 membro para iniciar." });
      return;
    }

    const memberIds = [user.id, ...selectedIds];
    const type = selectedIds.length >= 2 ? "group" : "direct";

    setCreating(true);
    const { data, error } = await supabase.rpc("create_conversation", {
      p_type: type,
      p_member_ids: memberIds,
      p_group_name: type === "group" ? groupName : null,
    });
    setCreating(false);

    if (error) {
      toast({ title: "Não foi possível criar conversa", description: error.message });
      return;
    }

    onConversationCreated(String(data));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" className="h-11" onClick={() => onOpenChange(true)}>
          <Send className="mr-2 h-4 w-4" aria-hidden="true" />
          Nova mensagem
        </Button>
      </DialogTrigger>

      <DialogContent className="border-0 bg-transparent p-0 shadow-none">
        <div className="invictus-modal-glass invictus-frame p-5">
          <DialogHeader>
            <DialogTitle>Nova mensagem</DialogTitle>
            <DialogDescription>Selecione 1 membro (DM) ou 2+ (grupo).</DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-3">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar membros" />

            {isGroup ? (
              <Input value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="Nome do grupo (opcional)" />
            ) : null}

            <div className="max-h-72 overflow-auto rounded-lg border border-border/60">
              {membersQuery.isLoading ? (
                <div className="p-3 text-sm text-muted-foreground">Carregando…</div>
              ) : membersQuery.isError ? (
                <div className="p-3 text-sm text-muted-foreground">Não foi possível listar membros.</div>
              ) : (
                <ul className="divide-y divide-border/60">
                  {(membersQuery.data ?? [])
                    .filter((m) => m.user_id !== user?.id)
                    .map((m) => (
                      <li key={m.user_id}>
                        <button
                          type="button"
                          onClick={() => toggle(m.user_id)}
                          className="flex w-full items-center gap-3 p-3 text-left hover:bg-muted/20"
                        >
                          <Checkbox checked={!!selected[m.user_id]} />
                          {m.avatar_url ? (
                            <img
                              src={m.avatar_url}
                              alt={`Avatar de ${m.display_name}`}
                              className="h-10 w-10 rounded-full object-cover border border-border/70"
                              loading="lazy"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full border border-border/70 invictus-surface" />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-medium">{m.display_name}</div>
                          </div>
                        </button>
                      </li>
                    ))}
                </ul>
              )}
            </div>

            <Button className="h-11 w-full" onClick={() => void create()} disabled={creating}>
              {creating ? "Criando…" : isGroup ? "Criar grupo" : "Iniciar conversa"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
