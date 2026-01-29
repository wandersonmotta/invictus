import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, X } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

type MessageRow = {
  id: string;
  sender_id: string;
  body: string | null;
  created_at: string;
};

export function ChatView({
  conversationId,
  meId,
  onBack,
  onAccepted,
}: {
  conversationId: string;
  meId: string;
  onBack?: () => void;
  onAccepted?: () => void;
}) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [text, setText] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [accepting, setAccepting] = React.useState(false);

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
        .select("id, sender_id, body, created_at")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as MessageRow[];
    },
    staleTime: 1_000,
  });

  // Realtime: novas mensagens
  React.useEffect(() => {
    if (!conversationId) return;
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        () => {
          qc.invalidateQueries({ queryKey: ["messages", conversationId] });
          qc.invalidateQueries({ queryKey: ["threads"] });
        },
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
    const { error } = await supabase.rpc("send_message", { p_conversation_id: conversationId, p_body: body });
    setSending(false);
    if (error) {
      toast({ title: "Falha ao enviar", description: error.message });
      return;
    }
    setText("");
    qc.invalidateQueries({ queryKey: ["messages", conversationId] });
    qc.invalidateQueries({ queryKey: ["threads"] });
  };

  return (
    <div className="flex h-[calc(100svh-220px)] flex-col">
      <div className="flex items-center gap-2 border-b border-border/60 p-3 sm:p-4">
        {onBack ? (
          <Button variant="ghost" size="icon" onClick={onBack} className="h-10 w-10">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">Voltar</span>
          </Button>
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">Conversa</div>
          <div className="truncate text-xs text-muted-foreground">Direct Invictus</div>
        </div>
      </div>

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

      <div className="flex-1 overflow-auto p-3 sm:p-4 space-y-2">
        {messagesQuery.isLoading ? (
          <div className="text-sm text-muted-foreground">Carregando mensagens…</div>
        ) : messagesQuery.data?.length ? (
          messagesQuery.data.map((m) => {
            const mine = m.sender_id === meId;
            return (
              <div key={m.id} className={mine ? "flex justify-end" : "flex justify-start"}>
                <div
                  className={
                    "max-w-[78%] rounded-2xl px-3 py-2 text-sm border border-border/60 " +
                    (mine ? "bg-muted/20" : "invictus-surface")
                  }
                >
                  {m.body}
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-sm text-muted-foreground">Ainda sem mensagens.</div>
        )}
      </div>

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
    </div>
  );
}
