import * as React from "react";
import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { CommunityThread } from "@/components/community/types";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Props = {
  channelId: string | null;
  selectedThreadId: string | null;
  onSelectThread: (threadId: string) => void;
  rightSlot?: React.ReactNode;
};

export function CommunityThreadList({ channelId, selectedThreadId, onSelectThread, rightSlot }: Props) {
  const [search, setSearch] = React.useState("");

  const threadsQuery = useQuery({
    queryKey: ["community", "threads", channelId, search],
    enabled: !!channelId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("list_community_threads", {
        p_channel_id: channelId,
        p_search: search || null,
        p_limit: 60,
        p_offset: 0,
      });
      if (error) throw error;
      return (data ?? []) as CommunityThread[];
    },
    staleTime: 10_000,
  });

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 sm:p-4 border-b border-border/60">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-medium">Temas</div>
            <div className="mt-1 text-xs text-muted-foreground">Crie ou selecione um tema para conversar.</div>
          </div>
          {rightSlot}
        </div>
        <div className="mt-3">
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar tema" />
        </div>
      </div>

      <div className="flex-1 p-2 overflow-auto">
        {!channelId ? (
          <div className="p-2 text-sm text-muted-foreground">Selecione um canal.</div>
        ) : threadsQuery.isLoading ? (
          <div className="p-2 text-sm text-muted-foreground">Carregando temas…</div>
        ) : threadsQuery.isError ? (
          <div className="p-2 text-sm text-muted-foreground">Não foi possível carregar os temas.</div>
        ) : !threadsQuery.data?.length ? (
          <div className="p-2 text-sm text-muted-foreground">Nenhum tema ainda. Crie o primeiro!</div>
        ) : (
          <div className="grid gap-1">
            {threadsQuery.data.map((t) => {
              const active = t.thread_id === selectedThreadId;
              return (
                <button
                  key={t.thread_id}
                  type="button"
                  onClick={() => onSelectThread(t.thread_id)}
                  className={cn(
                    "w-full text-left rounded-lg border px-3 py-2 transition-colors",
                    "invictus-surface invictus-frame border-border/60",
                    active ? "ring-2 ring-ring" : "hover:bg-accent",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium leading-tight line-clamp-2">{t.title}</div>
                      <div className="mt-1 text-xs text-muted-foreground truncate">
                        {t.author_display_name}
                        {t.author_username ? ` • ${t.author_username}` : ""}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground shrink-0">{t.post_count}</div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
