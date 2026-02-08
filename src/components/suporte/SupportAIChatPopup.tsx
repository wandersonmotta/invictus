import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { X, Send, Loader2, User } from "lucide-react";
import { AI_SUPPORT_AVATAR_URL } from "@/config/supportAvatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/AuthProvider";
import { useMyProfile } from "@/hooks/useMyProfile";
import { useIsMobileOrTablet } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SupportAIChatPopup({ open, onOpenChange }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: myProfile } = useMyProfile(user?.id);
  const isMobile = useIsMobileOrTablet();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) textareaRef.current?.focus();
  }, [open]);

  const handleEscalate = useCallback(async (chatHistory: Message[]) => {
    if (!user?.id) return;
    try {
      // Create ticket
      const { data: ticket, error: ticketErr } = await supabase
        .from("support_tickets")
        .insert({ user_id: user.id, status: "escalated", escalated_at: new Date().toISOString() } as any)
        .select("id")
        .single();
      if (ticketErr || !ticket) throw ticketErr;

      // Save chat history as messages
      const messagesToSave = chatHistory.map((msg) => ({
        ticket_id: ticket.id,
        sender_type: msg.role === "user" ? "user" : "ai",
        sender_id: msg.role === "user" ? user.id : null,
        body: msg.content,
      }));

      await supabase.from("support_messages").insert(messagesToSave as any);

      onOpenChange(false);
      setMessages([]);
      navigate(`/suporte/${ticket.id}`);
      toast.success("Você foi transferido para um atendente humano.");
    } catch (e) {
      console.error("Escalation error:", e);
      toast.error("Erro ao transferir para atendente.");
    }
  }, [user?.id, navigate, onOpenChange]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    setSending(true);

    const userMsg: Message = { role: "user", content: text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);

    let assistantContent = "";
    let thinkingFilterApplied = false;

    // Safety filter: strip nonsensical English prefixes from AI response start
    const sanitizeThinkingTokens = (text: string): string => {
      if (thinkingFilterApplied) return text;
      // Match random English words at the start (thinking tokens leak)
      const cleaned = text.replace(/^[\s]*(?:[a-zA-Z]{2,15}\s+){1,10}(?=[\p{L}])/u, "").trimStart();
      if (cleaned !== text) thinkingFilterApplied = true;
      return cleaned;
    };

    try {
      const session = (await supabase.auth.getSession()).data.session;
      if (!session) return;

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/support-chat-ephemeral`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ messages: updatedMessages }),
        }
      );

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        toast.error(errData.error || "Erro ao enviar mensagem");
        setSending(false);
        return;
      }

      const reader = resp.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let textBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              const displayContent = sanitizeThinkingTokens(assistantContent);
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: displayContent } : m);
                }
                if (!displayContent) return prev; // don't add empty message
                return [...prev, { role: "assistant", content: displayContent }];
              });
            }
          } catch { /* partial */ }
        }
      }

      // Check for escalation
      if (assistantContent.includes("[ESCALATE]")) {
        const cleanContent = assistantContent.replace(/\[ESCALATE\]/g, "").trim();
        const finalMessages = [...updatedMessages, { role: "assistant" as const, content: cleanContent }];
        setMessages((prev) => prev.map((m, i) => i === prev.length - 1 ? { ...m, content: cleanContent } : m));
        // Small delay to let user see the message
        setTimeout(() => handleEscalate(finalMessages), 1500);
      }
    } catch (e) {
      console.error(e);
      toast.error("Erro ao enviar mensagem");
    } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  }, [input, sending, messages, handleEscalate]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const chatContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card/80 backdrop-blur-sm shrink-0">
        <div className="flex items-center justify-center h-8 w-8 rounded-full overflow-hidden">
          <img src={AI_SUPPORT_AVATAR_URL} alt="Suporte IA" className="h-full w-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold">Suporte Invictus</h2>
          <p className="text-[10px] text-muted-foreground">Assistente IA</p>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onOpenChange(false)}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground text-sm py-8">
            Olá! Como posso ajudar? 👋
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={cn("flex gap-2", msg.role === "user" ? "justify-end" : "justify-start")}>
            {msg.role === "assistant" && (
              <div className="flex items-end">
                <div className="h-7 w-7 rounded-full overflow-hidden shrink-0">
                  <img src={AI_SUPPORT_AVATAR_URL} alt="Suporte IA" className="h-full w-full object-cover" />
                </div>
              </div>
            )}
            <div
              className={cn(
                "max-w-[80%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-md"
                  : "bg-muted/50 text-foreground rounded-bl-md"
              )}
            >
              {msg.content}
            </div>
            {msg.role === "user" && (
              <div className="flex items-end">
                <Avatar className="h-7 w-7">
                  <AvatarImage src={myProfile?.avatar_url || undefined} />
                  <AvatarFallback className="text-[10px]">
                    <User className="h-3.5 w-3.5" />
                  </AvatarFallback>
                </Avatar>
              </div>
            )}
          </div>
        ))}
        {sending && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Digitando...</span>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border p-3 bg-card/80 backdrop-blur-sm shrink-0">
        <div className="flex items-end gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite sua mensagem..."
            className="min-h-[40px] max-h-[100px] resize-none bg-muted/30 border-border text-sm"
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
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="h-[90vh] max-h-[90vh]">
          {chatContent}
        </DrawerContent>
      </Drawer>
    );
  }

  if (!open) return null;

  return (
    <div className="fixed bottom-20 right-6 z-50 w-[400px] h-[520px] rounded-2xl border border-border bg-background shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-5 fade-in duration-200">
      {chatContent}
    </div>
  );
}
