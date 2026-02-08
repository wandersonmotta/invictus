import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Paperclip, Send, Loader2, X, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/AuthProvider";
import { useMyProfile } from "@/hooks/useMyProfile";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SupportMessageBubble } from "./SupportMessageBubble";
import { SupportRatingDialog } from "./SupportRatingDialog";
import { toast } from "sonner";

interface Message {
  id: string;
  sender_type: string;
  sender_id: string | null;
  body: string | null;
  created_at: string;
  read_at?: string | null;
}

interface Attachment {
  id: string;
  message_id: string;
  file_name: string | null;
  content_type: string | null;
  storage_path: string;
  publicUrl?: string;
}

interface Props {
  ticketId: string;
}

export function SupportChatView({ ticketId }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: myProfile } = useMyProfile(user?.id);
  const [messages, setMessages] = useState<Message[]>([]);
  const [attachments, setAttachments] = useState<Record<string, Attachment[]>>({});
  const [agentProfiles, setAgentProfiles] = useState<Record<string, { name: string; avatar: string | null }>>({});
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [ticketStatus, setTicketStatus] = useState<string>("ai_handling");
  const [ticketAssignedTo, setTicketAssignedTo] = useState<string | null>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [ratingOpen, setRatingOpen] = useState(false);
  const [hasRated, setHasRated] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if already rated
  useEffect(() => {
    if (!ticketId || !user?.id) return;
    (supabase as any)
      .from("support_ratings")
      .select("id")
      .eq("ticket_id", ticketId)
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }: any) => {
        if (data) setHasRated(true);
      });
  }, [ticketId, user?.id]);

  // Load messages + attachments
  useEffect(() => {
    if (!ticketId) return;

    const loadMessages = async () => {
      const { data } = await supabase
        .from("support_messages")
        .select("*")
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true });
      if (data) {
        setMessages(data as any);
        loadAttachments((data as any).map((m: any) => m.id));
        loadAgentProfiles(data as any);
      }
    };

    const loadTicket = async () => {
      const { data } = await supabase
        .from("support_tickets")
        .select("status, assigned_to")
        .eq("id", ticketId)
        .single();
      if (data) {
        setTicketStatus(data.status);
        setTicketAssignedTo((data as any).assigned_to);
      }
    };

    loadMessages();
    loadTicket();

    const channel = supabase
      .channel(`support-msgs-${ticketId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "support_messages", filter: `ticket_id=eq.${ticketId}` },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          loadAttachments([newMsg.id]);
          if (newMsg.sender_type === "agent" && newMsg.sender_id) {
            loadAgentProfiles([newMsg] as any);
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "support_tickets", filter: `id=eq.${ticketId}` },
        (payload) => {
          const updated = payload.new as any;
          setTicketStatus(updated.status);
          setTicketAssignedTo(updated.assigned_to);
          // Show rating dialog when resolved (by any side)
          if (updated.status === "resolved" && !hasRated) {
            setRatingOpen(true);
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "support_messages", filter: `ticket_id=eq.${ticketId}` },
        (payload) => {
          const updated = payload.new as Message;
          setMessages((prev) => prev.map((m) => m.id === updated.id ? { ...m, read_at: updated.read_at } : m));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [ticketId, hasRated]);

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

  const loadAgentProfiles = async (msgs: Message[]) => {
    const agentIds = msgs
      .filter((m) => m.sender_type === "agent" && m.sender_id)
      .map((m) => m.sender_id!)
      .filter((id, i, arr) => arr.indexOf(id) === i);

    if (agentIds.length === 0) return;

    const missing = agentIds.filter((id) => !agentProfiles[id]);
    if (missing.length === 0) return;

    const { data } = await supabase
      .from("profiles")
      .select("user_id, display_name, avatar_url")
      .in("user_id", missing);

    if (data) {
      setAgentProfiles((prev) => {
        const next = { ...prev };
        (data as any[]).forEach((p) => {
          next[p.user_id] = { name: p.display_name || "Atendente", avatar: p.avatar_url };
        });
        return next;
      });
    }
  };

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

  const triggerSummarize = async () => {
    try {
      const session = (await supabase.auth.getSession()).data.session;
      if (!session) return;
      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/support-summarize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ ticketId }),
      });
    } catch (e) {
      console.error("Summarize error:", e);
    }
  };

  const handleResolve = async () => {
    await supabase
      .from("support_tickets")
      .update({ status: "resolved", resolved_at: new Date().toISOString() } as any)
      .eq("id", ticketId);
    toast.success("Atendimento encerrado!");
    triggerSummarize();
    if (!hasRated) setRatingOpen(true);
  };

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if ((!text && pendingFiles.length === 0) || sending) return;
    setInput("");
    const filesToSend = [...pendingFiles];
    setPendingFiles([]);
    setSending(true);

    try {
      if (ticketStatus === "ai_handling" && filesToSend.length === 0) {
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

        const reader = resp.body?.getReader();
        if (reader) {
          while (true) {
            const { done } = await reader.read();
            if (done) break;
          }
        }
      } else {
        const { data: msgData } = await supabase.from("support_messages").insert({
          ticket_id: ticketId,
          sender_type: "user",
          sender_id: user?.id,
          body: text || null,
        } as any).select("id").single();

        if (msgData && filesToSend.length > 0) {
          await uploadFiles((msgData as any).id, filesToSend);
        }
      }
    } catch (e) {
      console.error(e);
      toast.error("Erro ao enviar mensagem");
    } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  }, [input, sending, ticketId, ticketStatus, user, pendingFiles]);

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

  const handleEscalate = async () => {
    await supabase
      .from("support_tickets")
      .update({ status: "escalated", escalated_at: new Date().toISOString() } as any)
      .eq("id", ticketId);

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

  const canResolve = ticketStatus === "assigned" || ticketStatus === "escalated";

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
        {canResolve && (
          <Button variant="outline" size="sm" className="text-xs gap-1" onClick={handleResolve}>
            <CheckCircle className="h-3.5 w-3.5" /> Encerrar
          </Button>
        )}
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
        {messages.map((msg) => {
          const agentProfile = msg.sender_type === "agent" && msg.sender_id ? agentProfiles[msg.sender_id] : null;
          return (
            <SupportMessageBubble
              key={msg.id}
              senderType={msg.sender_type as any}
              body={msg.body}
              createdAt={msg.created_at}
              perspective="user"
              readAt={msg.read_at}
              senderName={msg.sender_type === "user" ? (myProfile?.display_name || "Você") : agentProfile?.name}
              senderAvatar={msg.sender_type === "user" ? (myProfile?.avatar_url || undefined) : (agentProfile?.avatar || undefined)}
              attachments={attachments[msg.id]}
            />
          );
        })}
        {sending && (
          <div className="flex items-center gap-2 text-muted-foreground text-xs ml-9">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>IA digitando...</span>
          </div>
        )}
      </div>

      {/* Pending files preview */}
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
        <div className="border-t border-border p-3 bg-card/50 backdrop-blur-sm shrink-0">
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
              placeholder="Digite sua mensagem..."
              className="min-h-[40px] max-h-[120px] resize-none bg-muted/30 border-border text-sm"
              rows={1}
            />
            <Button
              size="icon"
              className="h-10 w-10 shrink-0"
              disabled={(!input.trim() && pendingFiles.length === 0) || sending}
              onClick={handleSend}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Rating dialog */}
      {user && (
        <SupportRatingDialog
          open={ratingOpen}
          onOpenChange={(open) => {
            setRatingOpen(open);
            if (!open) setHasRated(true);
          }}
          ticketId={ticketId}
          userId={user.id}
          agentId={ticketAssignedTo}
        />
      )}
    </div>
  );
}
