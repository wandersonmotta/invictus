import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Send, CheckCircle, User, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/AuthProvider";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SupportMessageBubble } from "@/components/suporte/SupportMessageBubble";
import { isLovableHost } from "@/lib/appOrigin";
import { toast } from "sonner";

export default function SuporteAtendimento() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const basePath = isLovableHost(window.location.hostname) ? "/suporte-backoffice" : "";
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [ticketStatus, setTicketStatus] = useState<string>("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load ticket info
  const { data: ticket } = useQuery({
    queryKey: ["suporte-ticket", ticketId],
    enabled: !!ticketId,
    queryFn: async () => {
      const { data } = await supabase
        .from("support_tickets")
        .select("*")
        .eq("id", ticketId!)
        .single();
      return data as any;
    },
  });

  // Load user profile
  const { data: memberProfile } = useQuery({
    queryKey: ["suporte-member-profile", ticket?.user_id],
    enabled: !!ticket?.user_id,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("display_name, avatar_url, city, state, expertises")
        .eq("user_id", ticket!.user_id)
        .single();
      return data as any;
    },
  });

  useEffect(() => {
    if (ticket) setTicketStatus(ticket.status);
  }, [ticket]);

  // Load messages
  useEffect(() => {
    if (!ticketId) return;

    const load = async () => {
      const { data } = await supabase
        .from("support_messages")
        .select("*")
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true });
      if (data) setMessages(data as any);
    };
    load();

    const channel = supabase
      .channel(`suporte-agent-msgs-${ticketId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "support_messages", filter: `ticket_id=eq.${ticketId}` },
        (payload) => {
          setMessages((prev) => {
            if (prev.some((m) => m.id === (payload.new as any).id)) return prev;
            return [...prev, payload.new as any];
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "support_tickets", filter: `id=eq.${ticketId}` },
        (payload) => {
          setTicketStatus((payload.new as any).status);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [ticketId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || sending || !ticketId) return;
    setInput("");
    setSending(true);

    try {
      // Auto-assign on first agent message
      if (ticketStatus === "escalated") {
        await supabase
          .from("support_tickets")
          .update({ status: "assigned", assigned_to: user?.id } as any)
          .eq("id", ticketId);
      }

      await supabase.from("support_messages").insert({
        ticket_id: ticketId,
        sender_type: "agent",
        sender_id: user?.id,
        body: text,
      } as any);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao enviar mensagem");
    } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  }, [input, sending, ticketId, ticketStatus, user]);

  const handleResolve = async () => {
    if (!ticketId) return;
    await supabase
      .from("support_tickets")
      .update({ status: "resolved", resolved_at: new Date().toISOString() } as any)
      .eq("id", ticketId);
    toast.success("Ticket resolvido!");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] lg:h-[calc(100vh-3rem)] gap-4">
      {/* Chat area */}
      <div className="flex flex-1 flex-col rounded-xl border border-border bg-card/30 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card/50 shrink-0">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`${basePath}/dashboard`)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {memberProfile?.avatar_url ? (
              <img src={memberProfile.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover border border-border" />
            ) : (
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center"><User className="h-4 w-4" /></div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{memberProfile?.display_name || "Membro"}</p>
              <p className="text-[10px] text-muted-foreground">
                {ticketStatus === "assigned" ? "Em atendimento" : ticketStatus === "resolved" ? "Resolvido" : "Aguardando"}
              </p>
            </div>
          </div>
          {ticketStatus !== "resolved" && (
            <Button variant="outline" size="sm" className="text-xs gap-1" onClick={handleResolve}>
              <CheckCircle className="h-3.5 w-3.5" /> Resolver
            </Button>
          )}
        </div>

        {/* Messages - FULL HISTORY including AI */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg) => (
            <SupportMessageBubble
              key={msg.id}
              senderType={msg.sender_type}
              body={msg.body}
              createdAt={msg.created_at}
              senderName={
                msg.sender_type === "user"
                  ? memberProfile?.display_name
                  : msg.sender_type === "ai"
                    ? "Assistente IA"
                    : undefined
              }
              senderAvatar={msg.sender_type === "user" ? memberProfile?.avatar_url : undefined}
              perspective="agent"
            />
          ))}
        </div>

        {/* Input */}
        {ticketStatus !== "resolved" && (
          <div className="border-t border-border p-3 bg-card/50 shrink-0">
            <div className="flex items-end gap-2">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Responder ao membro..."
                className="min-h-[40px] max-h-[120px] resize-none bg-muted/30 border-border text-sm"
                rows={1}
              />
              <Button size="icon" className="h-10 w-10 shrink-0" disabled={!input.trim() || sending} onClick={handleSend}>
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Profile panel - desktop only */}
      <div className="hidden xl:flex w-72 flex-col rounded-xl border border-border bg-card/30 p-4 gap-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Perfil do Membro</h3>
        <div className="flex flex-col items-center gap-3 pt-2">
          {memberProfile?.avatar_url ? (
            <img src={memberProfile.avatar_url} alt="" className="h-20 w-20 rounded-full object-cover border-2 border-primary/30" />
          ) : (
            <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center border-2 border-border">
              <User className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
          <div className="text-center">
            <p className="font-semibold">{memberProfile?.display_name || "Membro"}</p>
            {memberProfile?.city && memberProfile?.state && (
              <p className="text-xs text-muted-foreground">{memberProfile.city}, {memberProfile.state}</p>
            )}
          </div>
        </div>
        {memberProfile?.expertises && memberProfile.expertises.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Especialidades</p>
            <div className="flex flex-wrap gap-1">
              {memberProfile.expertises.map((e: string) => (
                <span key={e} className="text-[10px] bg-primary/10 text-primary rounded-full px-2 py-0.5">{e}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
