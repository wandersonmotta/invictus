import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Paperclip, Send, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SupportMessageBubble } from "./SupportMessageBubble";
import { toast } from "sonner";

interface Message {
  id: string;
  sender_type: string;
  sender_id: string | null;
  body: string | null;
  created_at: string;
}

interface Props {
  ticketId: string;
}

export function SupportChatView({ ticketId }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [ticketStatus, setTicketStatus] = useState<string>("ai_handling");
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load messages
  useEffect(() => {
    if (!ticketId) return;

    const loadMessages = async () => {
      const { data } = await supabase
        .from("support_messages")
        .select("*")
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true });
      if (data) setMessages(data as any);
    };

    const loadTicket = async () => {
      const { data } = await supabase
        .from("support_tickets")
        .select("status")
        .eq("id", ticketId)
        .single();
      if (data) setTicketStatus(data.status);
    };

    loadMessages();
    loadTicket();

    // Realtime subscription
    const channel = supabase
      .channel(`support-msgs-${ticketId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "support_messages",
          filter: `ticket_id=eq.${ticketId}`,
        },
        (payload) => {
          setMessages((prev) => {
            if (prev.some((m) => m.id === (payload.new as any).id)) return prev;
            return [...prev, payload.new as Message];
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "support_tickets",
          filter: `id=eq.${ticketId}`,
        },
        (payload) => {
          setTicketStatus((payload.new as any).status);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticketId]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    setSending(true);

    try {
      if (ticketStatus === "ai_handling") {
        // Stream through edge function
        const session = (await supabase.auth.getSession()).data.session;
        if (!session) return;

        const resp = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/support-chat`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ ticketId, message: text }),
          }
        );

        if (!resp.ok) {
          const errData = await resp.json().catch(() => ({}));
          toast.error(errData.error || "Erro ao enviar mensagem");
          return;
        }

        // Read the stream but don't need to display token-by-token
        // because the edge function saves the full message which triggers realtime
        const reader = resp.body?.getReader();
        if (reader) {
          while (true) {
            const { done } = await reader.read();
            if (done) break;
          }
        }
      } else {
        // Direct message on escalated/assigned tickets
        await supabase.from("support_messages").insert({
          ticket_id: ticketId,
          sender_type: "user",
          sender_id: user?.id,
          body: text,
        } as any);
      }
    } catch (e) {
      console.error(e);
      toast.error("Erro ao enviar mensagem");
    } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  }, [input, sending, ticketId, ticketStatus, user]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEscalate = async () => {
    await supabase
      .from("support_tickets")
      .update({
        status: "escalated",
        escalated_at: new Date().toISOString(),
      } as any)
      .eq("id", ticketId);

    // Insert system-like AI message
    await supabase.from("support_messages").insert({
      ticket_id: ticketId,
      sender_type: "ai",
      sender_id: null,
      body: "Você foi transferido para um atendente humano. Aguarde um momento, em breve alguém irá te atender! 🙌",
    } as any);

    toast.success("Atendente humano solicitado!");
  };

  const statusLabel =
    ticketStatus === "ai_handling"
      ? "Assistente IA"
      : ticketStatus === "escalated"
        ? "Aguardando atendente..."
        : ticketStatus === "assigned"
          ? "Em atendimento"
          : ticketStatus === "resolved"
            ? "Resolvido"
            : "";

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card/50 backdrop-blur-sm shrink-0">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/suporte")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold truncate">Suporte Invictus</h2>
          <p className="text-[10px] text-muted-foreground">{statusLabel}</p>
        </div>
        {ticketStatus === "ai_handling" && (
          <Button variant="outline" size="sm" className="text-xs" onClick={handleEscalate}>
            Falar com atendente
          </Button>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground text-sm py-8">
            Envie sua primeira mensagem para iniciar o atendimento.
          </div>
        )}
        {messages.map((msg) => (
          <SupportMessageBubble
            key={msg.id}
            senderType={msg.sender_type as any}
            body={msg.body}
            createdAt={msg.created_at}
            perspective="user"
          />
        ))}
        {sending && (
          <div className="flex items-center gap-2 text-muted-foreground text-xs ml-9">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>IA digitando...</span>
          </div>
        )}
      </div>

      {/* Input */}
      {ticketStatus !== "resolved" && (
        <div className="border-t border-border p-3 bg-card/50 backdrop-blur-sm shrink-0">
          <div className="flex items-end gap-2">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite sua mensagem..."
              className="min-h-[40px] max-h-[120px] resize-none bg-muted/30 border-border text-sm"
              rows={1}
            />
            <Button
              size="icon"
              className="h-10 w-10 shrink-0"
              disabled={!input.trim() || sending}
              onClick={handleSend}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
