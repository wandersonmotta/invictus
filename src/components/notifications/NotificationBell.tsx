import * as React from "react";
import { Bell } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

import { supabase } from "@/integrations/supabase/client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type NotificationRow = {
  id: string;
  type:
    | "feed_like"
    | "feed_comment"
    | "follow"
    | "connection"
    | "dm_message"
    | "dm_request"
    | "dm_request_accepted"
    | "class_new_training"
    | (string & {});
  entity_id: string | null;
  conversation_id: string | null;
  created_at: string;
  read_at: string | null;
  data: any;
  actor_user_id: string | null;
  actor_display_name: string | null;
  actor_username: string | null;
  actor_avatar_url: string | null;
};

function initials(name?: string | null) {
  const n = (name ?? "").trim();
  return (n[0] ?? "N").toUpperCase();
}

function buildMessage(n: NotificationRow) {
  const who = n.actor_display_name?.trim() || "Alguém";
  const preview = (n.data?.comment_preview as string | undefined)?.trim();

  switch (n.type) {
    case "feed_like":
      return `${who} curtiu sua publicação`;
    case "feed_comment":
      return preview ? `${who} comentou: “${preview}”` : `${who} comentou na sua publicação`;
    case "follow":
      return `${who} começou a te seguir`;
    case "connection":
      return `Você e ${who} agora são conexões`;
    case "dm_request":
      return `Solicitação de mensagem de ${who}`;
    case "dm_request_accepted":
      return `${who} aceitou sua solicitação de mensagem`;
    case "dm_message":
      return `Nova mensagem de ${who}`;
    case "class_new_training":
      return "Novo treinamento publicado no Class";
    default:
      return "Nova notificação";
  }
}

function buildHref(n: NotificationRow): string {
  switch (n.type) {
    case "feed_like":
    case "feed_comment":
      return n.entity_id ? `/feed?post=${encodeURIComponent(n.entity_id)}` : "/feed";
    case "follow":
    case "connection": {
      const u = (n.actor_username ?? "").replace(/^@/, "");
      return u ? `/membro/${encodeURIComponent(u)}` : "/buscar";
    }
    case "dm_message":
    case "dm_request":
    case "dm_request_accepted":
      return n.conversation_id ? `/mensagens/${encodeURIComponent(n.conversation_id)}` : "/mensagens";
    case "class_new_training":
      return "/class";
    default:
      return "/";
  }
}

export function NotificationBell() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const unreadQuery = useQuery({
    queryKey: ["notifications", "unread"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("count_unread_notifications" as any);
      if (error) throw error;
      return Number(data ?? 0);
    },
    staleTime: 10_000,
    refetchInterval: 30_000,
  });

  const listQuery = useQuery({
    queryKey: ["notifications", "list"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("list_my_notifications" as any, {
        p_limit: 20,
        p_before: null,
      });
      if (error) throw error;
      return (data ?? []) as NotificationRow[];
    },
    staleTime: 10_000,
  });

  const markRead = useMutation({
    mutationFn: async () => {
      const nowIso = new Date().toISOString();
      const { error } = await supabase.rpc("mark_notifications_read" as any, { p_before: nowIso });
      if (error) throw error;
    },
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["notifications", "unread"] }),
        qc.invalidateQueries({ queryKey: ["notifications", "list"] }),
      ]);
    },
  });

  const unread = unreadQuery.data ?? 0;
  const badgeText = unread > 99 ? "99+" : String(unread);

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (!open) return;
        void listQuery.refetch();
        if (unread > 0 && !markRead.isPending) {
          void markRead.mutateAsync();
        }
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={
            "relative rounded-full " +
            "hover:bg-[hsl(var(--foreground)_/_0.04)] hover:text-foreground " +
            "data-[state=open]:bg-[hsl(var(--foreground)_/_0.05)] " +
            "focus-visible:ring-1 focus-visible:ring-ring/40"
          }
          aria-label="Notificações"
        >
          <Bell className="h-5 w-5" />

          {unread > 0 ? (
            <span
              className={
                "absolute -right-0.5 -top-0.5 " +
                "min-w-[18px] h-[18px] px-1 " +
                "rounded-full " +
                "bg-[hsl(var(--gold-hot))] text-[hsl(var(--gold-badge-foreground))] " +
                "text-[10px] font-bold leading-[18px] text-center " +
                "shadow-[0_0_0_1px_hsl(var(--background)_/_0.55),0_10px_30px_-18px_hsl(var(--gold-hot)_/_0.35)]"
              }
            >
              {badgeText}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="invictus-topbar-menu-glass z-50 w-[360px] max-w-[calc(100vw-1.5rem)] p-1"
      >
        <div className="px-2 py-2">
          <div className="text-xs font-semibold tracking-wide">Notificações</div>
          <div className="text-[11px] text-muted-foreground">Novidades e eventos da sua conta.</div>
        </div>

        <div className="h-px bg-[hsl(var(--foreground)_/_0.06)] mx-1" />

        {listQuery.isLoading ? (
          <div className="px-3 py-4 text-sm text-muted-foreground">Carregando…</div>
        ) : listQuery.isError ? (
          <div className="px-3 py-4 text-sm text-muted-foreground">Não foi possível carregar suas notificações.</div>
        ) : (listQuery.data ?? []).length === 0 ? (
          <div className="px-3 py-5 text-sm text-muted-foreground">Sem novidades por enquanto.</div>
        ) : (
          <div className="max-h-[420px] overflow-auto">
            {(listQuery.data ?? []).map((n) => {
              const when = formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ptBR });
              const message = buildMessage(n);
              const href = buildHref(n);
              const isUnread = !n.read_at;
              return (
                <DropdownMenuItem
                  key={n.id}
                  className={
                    "group gap-3 cursor-pointer rounded-md items-start " +
                    "focus:bg-[hsl(var(--foreground)_/_0.06)] focus:text-foreground " +
                    "data-[highlighted]:bg-[hsl(var(--foreground)_/_0.05)] data-[highlighted]:text-foreground"
                  }
                  onClick={() => navigate(href)}
                >
                  <Avatar className="h-8 w-8 mt-0.5">
                    <AvatarImage src={n.actor_avatar_url ?? undefined} alt="Avatar" />
                    <AvatarFallback className="text-[10px]">{initials(n.actor_display_name)}</AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className={"min-w-0 text-sm leading-snug " + (isUnread ? "text-foreground" : "text-muted-foreground")}>
                        <span className="line-clamp-2">{message}</span>
                      </div>
                      <div className="shrink-0 text-[10px] text-muted-foreground">{when}</div>
                    </div>
                    {isUnread ? <div className="mt-1 h-px w-10 bg-[hsl(var(--gold-hot)_/_0.35)]" /> : null}
                  </div>
                </DropdownMenuItem>
              );
            })}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
