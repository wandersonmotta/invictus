import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, X, MoreVertical, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { MessageBubble, type MessageRow } from "./MessageBubble";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function ChatView({
  conversationId,
  meId,
  onBack,
  onAccepted,
  onConversationHidden,
}: {
  conversationId: string;
  meId: string;
  onBack?: () => void;
  onAccepted?: () => void;
  onConversationHidden?: () => void;
}) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [text, setText] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [accepting, setAccepting] = React.useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  const membershipQuery = useQuery({
    queryKey: ["my_membership", conversationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conversation_members")
        .select("folder, accepted_at")
        .eq("conversation_id", conversationId)
        .eq("user_id", meId)
        .maybeSingle();
      if (error) throw error;
      return data as { folder: "inbox" | "requests"; accepted_at: string | null } | null;
    },
    enabled: !!meId,
    staleTime: 2_000,
  });

  const messagesQuery = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("id, sender_id, body, created_at, edited_at, deleted_at, deleted_for")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as MessageRow[];
    },
    staleTime: 1_000,
  });

  // Mensagens visíveis (exclui as que o usuário deletou para si)
  const displayMessages = React.useMemo(() => {
    return (messagesQuery.data ?? []).filter((m) => {
      if (m.deleted_for?.includes(meId)) return false;
      return true;
    });
  }, [messagesQuery.data, meId]);

  // Realtime: novas mensagens
  React.useEffect(() => {
    if (!conversationId) return;
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: ["messages", conversationId] });
          qc.invalidateQueries({ queryKey: ["threads"] });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, qc]);

  const isRequest = membershipQuery.data?.folder === "requests" && !membershipQuery.data?.accepted_at;

  const accept = async () => {
    setAccepting(true);
    const { error } = await supabase
      .from("conversation_members")
      .update({ accepted_at: new Date().toISOString(), folder: "inbox" })
      .eq("conversation_id", conversationId)
      .eq("user_id", meId);
    setAccepting(false);
    if (error) {
      toast({ title: "Não foi possível aceitar", description: error.message });
      return;
    }
    qc.invalidateQueries({ queryKey: ["threads"] });
    membershipQuery.refetch();
    onAccepted?.();
  };

  const send = async () => {
    const body = text.trim();
    if (!body) return;
    setSending(true);
    const { error } = await supabase.rpc("send_message", {
      p_conversation_id: conversationId,
      p_body: body,
    });
    setSending(false);
    if (error) {
      toast({ title: "Falha ao enviar", description: error.message });
      return;
    }
    setText("");
    qc.invalidateQueries({ queryKey: ["messages", conversationId] });
    qc.invalidateQueries({ queryKey: ["threads"] });
  };

  const handleDeleteConversation = async () => {
    setDeleting(true);
    const { error } = await supabase
      .from("conversation_members")
      .update({ hidden_at: new Date().toISOString() })
      .eq("conversation_id", conversationId)
      .eq("user_id", meId);
    setDeleting(false);
    setShowDeleteDialog(false);

    if (error) {
      toast({ title: "Não foi possível excluir", description: error.message });
      return;
    }

    toast({ title: "Conversa excluída", description: "A conversa foi removida da sua lista." });
    qc.invalidateQueries({ queryKey: ["threads"] });
    onConversationHidden?.();
  };

  const handleMessagesUpdated = () => {
    qc.invalidateQueries({ queryKey: ["messages", conversationId] });
  };

  return (
    <div className="flex h-[calc(100svh-220px)] flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border/60 p-3 sm:p-4">
        {onBack ? (
          <Button variant="ghost" size="icon" onClick={onBack} className="h-10 w-10">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">Voltar</span>
          </Button>
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-foreground">Conversa</div>
        </div>

        {/* Menu de opções da conversa */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-10 w-10">
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Opções</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir conversa
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Request banner */}
      {isRequest ? (
        <div className="border-b border-border/60 p-3 sm:p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-medium">Solicitação de conversa</div>
              <div className="text-xs text-muted-foreground">Aceite para mover para o Inbox e responder.</div>
            </div>
            <div className="flex gap-2">
              <Button className="h-10" onClick={() => void accept()} disabled={accepting}>
                <Check className="mr-2 h-4 w-4" aria-hidden="true" />
                Aceitar
              </Button>
              <Button variant="secondary" className="h-10" disabled>
                <X className="mr-2 h-4 w-4" aria-hidden="true" />
                Recusar
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Messages */}
      <div className="flex-1 overflow-auto p-3 sm:p-4 space-y-2">
        {messagesQuery.isLoading ? (
          <div className="text-sm text-muted-foreground">Carregando mensagens…</div>
        ) : displayMessages.length ? (
          displayMessages.map((m) => (
            <MessageBubble key={m.id} message={m} meId={meId} onUpdated={handleMessagesUpdated} />
          ))
        ) : (
          <div className="text-sm text-muted-foreground">Ainda sem mensagens.</div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border/60 p-3 sm:p-4">
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
        >
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={isRequest ? "Aceite para responder" : "Mensagem"}
            disabled={sending || isRequest}
          />
          <Button type="submit" className="h-10" disabled={sending || isRequest || !text.trim()}>
            Enviar
          </Button>
        </form>
        <div className="mt-2 text-xs text-muted-foreground">Anexos (upload) entra na próxima etapa.</div>
      </div>

      {/* Delete Conversation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="invictus-modal-glass invictus-frame">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir conversa?</AlertDialogTitle>
            <AlertDialogDescription>
              A conversa será removida da sua lista. As mensagens permanecerão visíveis para os outros participantes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConversation} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? "Excluindo…" : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
