import * as React from "react";
import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import type { ConversationFolder, ThreadRow } from "@/components/messages/types";

function formatTime(ts: string | null) {
  if (!ts) return "";
  try {
    const d = new Date(ts);
    return d.toLocaleDateString(undefined, { day: "2-digit", month: "2-digit" });
  } catch {
    return "";
  }
}

export function ThreadList({
  folder,
  search,
  selectedConversationId,
  onSelectConversation,
}: {
  folder: ConversationFolder;
  search: string;
  selectedConversationId: string | null;
  onSelectConversation: (id: string) => void;
}) {
  const threadsQuery = useQuery({
    queryKey: ["threads", folder],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_my_threads", { p_folder: folder });
      if (error) throw error;
      return (data ?? []) as ThreadRow[];
    },
    staleTime: 2_000,
  });

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return threadsQuery.data ?? [];
    return (threadsQuery.data ?? []).filter((t) => t.title.toLowerCase().includes(q));
  }, [threadsQuery.data, search]);

  if (threadsQuery.isLoading) {
    return <div className="p-4 text-sm text-muted-foreground">Carregando conversas…</div>;
  }

  if (threadsQuery.isError) {
    return <div className="p-4 text-sm text-muted-foreground">Não foi possível carregar suas conversas.</div>;
  }

  if (!filtered.length) {
    return <div className="p-4 text-sm text-muted-foreground">Nenhuma conversa aqui ainda.</div>;
  }

  return (
    <div className="max-h-[calc(100svh-260px)] overflow-auto">
      <ul className="divide-y divide-border/60">
        {filtered.map((t) => (
          <li key={t.conversation_id}>
            <button
              type="button"
              onClick={() => onSelectConversation(t.conversation_id)}
              className={cn(
                "w-full px-4 py-3 text-left transition-colors hover:bg-muted/20",
                selectedConversationId === t.conversation_id && "bg-muted/20",
              )}
            >
              <div className="flex items-center gap-3">
                <div className="relative h-11 w-11 shrink-0">
                  {t.avatar_urls?.[0] ? (
                    <img
                      src={t.avatar_urls[0]}
                      alt={`Avatar de ${t.title}`}
                      className="h-11 w-11 rounded-full object-cover border border-border/70"
                      loading="lazy"
                    />
                  ) : (
                    <div className="h-11 w-11 rounded-full border border-border/70 invictus-surface" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="truncate text-sm font-medium">{t.title}</div>
                    <div className="shrink-0 text-xs text-muted-foreground">{formatTime(t.last_message_at)}</div>
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
                    {folder === "requests" && !t.accepted ? "Solicitação pendente" : "Toque para abrir"}
                  </div>
                </div>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
