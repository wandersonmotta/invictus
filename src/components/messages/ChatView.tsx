import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, X, MoreVertical, Trash2, Mic, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { MessageBubble, type MessageRow } from "./MessageBubble";
import { AudioRecorder } from "./AudioRecorder";
import { AttachmentPicker } from "./AttachmentPicker";
import { AttachmentPreview, type AttachmentFile } from "./AttachmentPreview";
import { rpcUntyped } from "@/lib/rpc";
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
  const [isRecording, setIsRecording] = React.useState(false);
  const [attachments, setAttachments] = React.useState<AttachmentFile[]>([]);
  const [audioBlob, setAudioBlob] = React.useState<Blob | null>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

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
      // Fetch messages with their attachments
      const { data, error } = await supabase
        .from("messages")
        .select(`
          id, 
          sender_id, 
          body, 
          created_at, 
          edited_at, 
          deleted_at, 
          deleted_for,
          message_attachments (
            id,
            storage_path,
            content_type,
            file_name,
            size_bytes
          )
        `)
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })
        .limit(200);
      if (error) throw error;
      
      // Transform to match MessageRow type
      return (data ?? []).map((m: any) => ({
        ...m,
        attachments: m.message_attachments ?? [],
      })) as MessageRow[];
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

  // Scroll to bottom when messages change
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [displayMessages]);

  const handleFilesSelected = (files: File[]) => {
    const newAttachments: AttachmentFile[] = files.map((file) => ({
      file,
      previewUrl: file.type.startsWith("image/")
        ? URL.createObjectURL(file)
        : undefined,
    }));
    setAttachments((prev) => [...prev, ...newAttachments]);
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => {
      const att = prev[index];
      if (att.previewUrl) {
        URL.revokeObjectURL(att.previewUrl);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleRemoveAudio = () => {
    setAudioBlob(null);
  };

  const handleRecordingComplete = (blob: Blob) => {
    setAudioBlob(blob);
    setIsRecording(false);
  };

  const handleCancelRecording = () => {
    setIsRecording(false);
  };

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

  const uploadAttachment = async (
    messageId: string,
    file: File
  ): Promise<boolean> => {
    const path = `${conversationId}/${messageId}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("dm-attachments")
      .upload(path, file);

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return false;
    }

    // Insert metadata
    const { error: metaError } = await supabase
      .from("message_attachments")
      .insert({
        message_id: messageId,
        storage_path: path,
        content_type: file.type,
        file_name: file.name,
        size_bytes: file.size,
      });

    if (metaError) {
      console.error("Metadata error:", metaError);
      return false;
    }

    return true;
  };

  const send = async () => {
    const body = text.trim() || null;
    const hasContent = body || attachments.length > 0 || audioBlob;

    if (!hasContent) return;

    setSending(true);

    // Use the new RPC that allows null body
    const { data: messageId, error } = await rpcUntyped<string>(
      "send_message_with_attachments",
      {
      p_conversation_id: conversationId,
      p_body: body,
      }
    );

    if (error) {
      setSending(false);
      toast({ title: "Falha ao enviar", description: String(error.message || error) });
      return;
    }

    // Upload attachments
    for (const att of attachments) {
      await uploadAttachment(messageId, att.file);
    }

    // Upload audio if present
    if (audioBlob) {
      const ext = audioBlob.type.includes("webm") ? "webm" : "mp4";
      const audioFile = new File([audioBlob], `audio_${Date.now()}.${ext}`, {
        type: audioBlob.type,
      });
      await uploadAttachment(messageId, audioFile);
    }

    // Clear state
    setText("");
    setAttachments([]);
    setAudioBlob(null);
    setSending(false);

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
            <MessageBubble
              key={m.id}
              message={m}
              meId={meId}
              onUpdated={handleMessagesUpdated}
              conversationId={conversationId}
            />
          ))
        ) : (
          <div className="text-sm text-muted-foreground">Ainda sem mensagens.</div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Attachment Preview */}
      {(attachments.length > 0 || audioBlob) && (
        <AttachmentPreview
          attachments={attachments}
          audioBlob={audioBlob}
          onRemoveAttachment={handleRemoveAttachment}
          onRemoveAudio={handleRemoveAudio}
        />
      )}

      {/* Input Area */}
      <div className="border-t border-border/60 p-3 sm:p-4">
        {isRecording ? (
          <AudioRecorder
            onRecordingComplete={handleRecordingComplete}
            onCancel={handleCancelRecording}
          />
        ) : (
          <form
            className="flex items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
          >
            <AttachmentPicker
              onFilesSelected={handleFilesSelected}
              disabled={sending || isRequest}
            />

            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={isRequest ? "Aceite para responder" : "Mensagem"}
              disabled={sending || isRequest}
              className="flex-1"
            />

            {text.trim() || attachments.length > 0 || audioBlob ? (
              <Button
                type="submit"
                size="icon"
                className="h-10 w-10"
                disabled={sending || isRequest}
              >
                <Send className="h-5 w-5" />
                <span className="sr-only">Enviar</span>
              </Button>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-10 w-10"
                disabled={sending || isRequest}
                onClick={() => setIsRecording(true)}
              >
                <Mic className="h-5 w-5" />
                <span className="sr-only">Gravar áudio</span>
              </Button>
            )}
          </form>
        )}
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
