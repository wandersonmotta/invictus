import * as React from "react";
import { MoreVertical, Pencil, Trash2, UserX } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type MessageRow = {
  id: string;
  sender_id: string;
  body: string | null;
  created_at: string;
  edited_at?: string | null;
  deleted_at?: string | null;
  deleted_for?: string[] | null;
};

interface MessageBubbleProps {
  message: MessageRow;
  meId: string;
  onUpdated: () => void;
}

export function MessageBubble({ message, meId, onUpdated }: MessageBubbleProps) {
  const { toast } = useToast();
  const [editing, setEditing] = React.useState(false);
  const [editText, setEditText] = React.useState(message.body ?? "");
  const [saving, setSaving] = React.useState(false);

  const mine = message.sender_id === meId;
  const isDeleted = !!message.deleted_at;
  const isDeletedForMe = message.deleted_for?.includes(meId);

  // Não renderiza se foi excluída para mim
  if (isDeletedForMe) return null;

  // Não renderiza se foi excluída para todos (some totalmente, igual Instagram)
  if (isDeleted) return null;

  const formatTime = (ts: string) => {
    try {
      return new Date(ts).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  const handleEdit = async () => {
    const body = editText.trim();
    if (!body) {
      toast({ title: "Mensagem vazia", description: "Digite o novo texto." });
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("messages")
      .update({ body, edited_at: new Date().toISOString() })
      .eq("id", message.id)
      .eq("sender_id", meId);
    setSaving(false);

    if (error) {
      toast({ title: "Erro ao editar", description: error.message });
      return;
    }

    setEditing(false);
    onUpdated();
  };

  const handleDeleteForAll = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("messages")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", message.id)
      .eq("sender_id", meId);
    setSaving(false);

    if (error) {
      toast({ title: "Erro ao excluir", description: error.message });
      return;
    }

    onUpdated();
  };

  const handleDeleteForMe = async () => {
    setSaving(true);
    const { error } = await supabase.rpc("delete_message_for_me", { p_message_id: message.id });
    setSaving(false);

    if (error) {
      toast({ title: "Erro ao excluir", description: error.message });
      return;
    }

    onUpdated();
  };

  return (
    <div className={cn("flex group", mine ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[78%] rounded-2xl px-3 py-2 text-sm border border-border/60 relative",
          mine ? "bg-muted/20" : "invictus-surface"
        )}
      >
        {editing ? (
          <div className="flex flex-col gap-2">
            <Input
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="h-8 text-sm"
              disabled={saving}
              autoFocus
            />
            <div className="flex gap-2">
              <Button size="sm" className="h-7 text-xs" onClick={handleEdit} disabled={saving}>
                Salvar
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs"
                onClick={() => {
                  setEditing(false);
                  setEditText(message.body ?? "");
                }}
                disabled={saving}
              >
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div>{message.body}</div>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-[10px] text-muted-foreground">{formatTime(message.created_at)}</span>
              {message.edited_at && (
                <span className="text-[10px] text-muted-foreground italic">(editada)</span>
              )}
            </div>
          </>
        )}

        {/* Menu de ações - só aparece para mensagens próprias */}
        {mine && !editing && (
          <div className="absolute -right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <MoreVertical className="h-3 w-3" />
                  <span className="sr-only">Opções</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setEditing(true)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDeleteForAll} className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir para todos
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDeleteForMe}>
                  <UserX className="mr-2 h-4 w-4" />
                  Excluir para mim
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* Menu para mensagens de outros - só excluir para mim */}
        {!mine && !editing && (
          <div className="absolute -right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <MoreVertical className="h-3 w-3" />
                  <span className="sr-only">Opções</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={handleDeleteForMe}>
                  <UserX className="mr-2 h-4 w-4" />
                  Excluir para mim
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </div>
  );
}
