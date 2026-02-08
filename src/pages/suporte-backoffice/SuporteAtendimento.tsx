import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Send, CheckCircle, User, Loader2, Paperclip, X, ArrowRightLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/AuthProvider";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SupportMessageBubble } from "@/components/suporte/SupportMessageBubble";
import { TransferTicketDialog } from "@/components/suporte-backoffice/TransferTicketDialog";
import { isLovableHost } from "@/lib/appOrigin";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useIsSuporteGerente } from "@/hooks/useIsSuporteGerente";
import { toast } from "sonner";

interface Attachment {
  id: string;
  message_id: string;
  file_name: string | null;
  content_type: string | null;
  storage_path: string;
  publicUrl?: string;
}

export default function SuporteAtendimento() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const basePath = isLovableHost(window.location.hostname) ? "/suporte-backoffice" : "";
  const { data: isAdmin } = useIsAdmin(user?.id);
  const { data: isGerente } = useIsSuporteGerente(user?.id);
  const canTransfer = isAdmin || isGerente;

  const [messages, setMessages] = useState<any[]>([]);
  const [attachments, setAttachments] = useState<Record<string, Attachment[]>>({});
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [ticketStatus, setTicketStatus] = useState<string>("");
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [transferOpen, setTransferOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load ticket info
  const { data: ticket, refetch: refetchTicket } = useQuery({
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

  // Load agents for transfer dialog
  const { data: agentsList } = useQuery({
    queryKey: ["support-agents-for-transfer"],
    enabled: !!canTransfer,
    queryFn: async () => {
      const session = (await supabase.auth.getSession()).data.session;
      if (!session) return [];
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-support-agents`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ action: "list" }),
        }
      );
      const data = await resp.json();
      return data.agents || [];
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

  // Load own profile for agent avatar
  const { data: ownProfile } = useQuery({
    queryKey: ["suporte-own-profile", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("user_id", user!.id)
        .single();
      return data as any;
    },
  });

  useEffect(() => {
    if (ticket) setTicketStatus(ticket.status);
  }, [ticket]);

  const loadAttachments = async (messageIds: string[]) => {
    if (messageIds.length === 0) return;
    const { data } = await supabase
      .from("support_message_attachments")
      .select("*")
      .in("message_id", messageIds);
    if (!data || data.length === 0) return;

    const withUrls = (data as any[]).map((att) => {
      const { data: urlData } = supabase.storage
        .from(att.storage_bucket || "support-attachments")
        .getPublicUrl(att.storage_path);
      return { ...att, publicUrl: urlData?.publicUrl };
    });

    setAttachments((prev) => {
      const next = { ...prev };
      withUrls.forEach((att) => {
        if (!next[att.message_id]) next[att.message_id] = [];
        if (!next[att.message_id].some((a: any) => a.id === att.id)) {
          next[att.message_id] = [...next[att.message_id], att];
        }
      });
      return next;
    });
  };

  const markAsRead = useCallback(async () => {
    if (!ticketId) return;
    await supabase
      .from("support_messages")
      .update({ read_at: new Date().toISOString() } as any)
      .eq("ticket_id", ticketId)
      .eq("sender_type", "user")
      .is("read_at", null);
  }, [ticketId]);

  useEffect(() => {
    if (!ticketId) return;

    const load = async () => {
      const { data } = await supabase
        .from("support_messages")
        .select("*")
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true });
      if (data) {
        setMessages(data as any);
        loadAttachments((data as any).map((m: any) => m.id));
        markAsRead();
      }
    };
    load();

    const channel = supabase
      .channel(`suporte-agent-msgs-${ticketId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "support_messages", filter: `ticket_id=eq.${ticketId}` },
        (payload) => {
          const newMsg = payload.new as any;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          loadAttachments([newMsg.id]);
          if (newMsg.sender_type === "user") markAsRead();
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "support_tickets", filter: `id=eq.${ticketId}` },
        (payload) => setTicketStatus((payload.new as any).status)
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [ticketId, markAsRead]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const uploadFiles = async (messageId: string, files: File[]) => {
    for (const file of files) {
      const path = `${ticketId}/${messageId}/${Date.now()}_${file.name}`;
      const { error: uploadErr } = await supabase.storage
        .from("support-attachments")
        .upload(path, file);
      if (uploadErr) {
        console.error("Upload error:", uploadErr);
        continue;
      }
      await supabase.from("support_message_attachments").insert({
        message_id: messageId,
        storage_path: path,
        file_name: file.name,
        content_type: file.type,
        size_bytes: file.size,
      } as any);
    }
  };

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if ((!text && pendingFiles.length === 0) || sending || !ticketId) return;
    setInput("");
    const filesToSend = [...pendingFiles];
    setPendingFiles([]);
    setSending(true);

    try {
      if (ticketStatus === "escalated") {
        await supabase
          .from("support_tickets")
          .update({ status: "assigned", assigned_to: user?.id } as any)
          .eq("id", ticketId);
      }

      const { data: msgData } = await supabase.from("support_messages").insert({
        ticket_id: ticketId,
        sender_type: "agent",
        sender_id: user?.id,
        body: text || null,
      } as any).select("id").single();

      if (msgData && filesToSend.length > 0) {
        await uploadFiles((msgData as any).id, filesToSend);
      }
    } catch (e) {
      console.error(e);
      toast.error("Erro ao enviar mensagem");
    } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  }, [input, sending, ticketId, ticketStatus, user, pendingFiles]);

  const handleResolve = async () => {
    if (!ticketId) return;
    await supabase
      .from("support_tickets")
      .update({ status: "resolved", resolved_at: new Date().toISOString() } as any)
      .eq("id", ticketId);
    toast.success("Ticket resolvido!");

    try {
      const session = (await supabase.auth.getSession()).data.session;
      if (session) {
        fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/support-summarize`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ ticketId }),
        }).catch(console.error);
      }
    } catch (e) {
      console.error("Summarize error:", e);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setPendingFiles((prev) => [...prev, ...files]);
    e.target.value = "";
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
          <div className="flex items-center gap-2">
            {canTransfer && ticketStatus !== "resolved" && (
              <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => setTransferOpen(true)}>
                <ArrowRightLeft className="h-3.5 w-3.5" /> Transferir
              </Button>
            )}
            {ticketStatus !== "resolved" && (
              <Button variant="outline" size="sm" className="text-xs gap-1" onClick={handleResolve}>
                <CheckCircle className="h-3.5 w-3.5" /> Resolver
              </Button>
            )}
          </div>
        </div>

        {/* Messages */}
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
                    : ownProfile?.display_name || undefined
              }
              senderAvatar={
                msg.sender_type === "user"
                  ? memberProfile?.avatar_url
                  : msg.sender_type === "agent"
                    ? ownProfile?.avatar_url || undefined
                    : undefined
              }
              perspective="agent"
              attachments={attachments[msg.id]}
            />
          ))}
        </div>

        {/* Pending files */}
        {pendingFiles.length > 0 && (
          <div className="border-t border-border px-3 py-2 flex gap-2 flex-wrap bg-card/50">
            {pendingFiles.map((f, i) => (
              <div key={i} className="flex items-center gap-1 bg-muted/50 rounded-lg px-2 py-1 text-xs">
                <span className="truncate max-w-[120px]">{f.name}</span>
                <button onClick={() => setPendingFiles((prev) => prev.filter((_, j) => j !== i))}>
                  <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input */}
        {ticketStatus !== "resolved" && (
          <div className="border-t border-border p-3 bg-card/50 shrink-0">
            <div className="flex items-end gap-2">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx,.txt"
                className="hidden"
                onChange={handleFileSelect}
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 shrink-0"
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Responder ao membro..."
                className="min-h-[40px] max-h-[120px] resize-none bg-muted/30 border-border text-sm"
                rows={1}
              />
              <Button size="icon" className="h-10 w-10 shrink-0" disabled={(!input.trim() && pendingFiles.length === 0) || sending} onClick={handleSend}>
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

      {/* Transfer dialog */}
      {canTransfer && ticketId && (
        <TransferTicketDialog
          open={transferOpen}
          onOpenChange={setTransferOpen}
          ticketId={ticketId}
          currentAssignedTo={ticket?.assigned_to || null}
          agents={agentsList || []}
          onTransferred={() => refetchTicket()}
        />
      )}
    </div>
  );
}
