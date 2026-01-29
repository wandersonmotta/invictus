import * as React from "react";
import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { CommunityChannel } from "@/components/community/types";
import { cn } from "@/lib/utils";

type Props = {
  value: string | null;
  onChange: (channel: CommunityChannel) => void;
};

export function ChannelList({ value, onChange }: Props) {
  const channelsQuery = useQuery({
    queryKey: ["community", "channels"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("list_community_channels");
      if (error) throw error;
      return (data ?? []) as CommunityChannel[];
    },
    staleTime: 60_000,
  });

  React.useEffect(() => {
    if (!value && channelsQuery.data?.length) {
      onChange(channelsQuery.data[0]);
    }
  }, [value, channelsQuery.data, onChange]);

  return (
    <div className="h-full">
      <div className="p-3 sm:p-4 border-b border-border/60">
        <div className="text-sm font-medium">Canais</div>
        <div className="mt-1 text-xs text-muted-foreground">Escolha um canal para ver as mensagens.</div>
      </div>

      <div className="p-2">
        {channelsQuery.isLoading ? (
          <div className="p-2 text-sm text-muted-foreground">Carregando canais…</div>
        ) : channelsQuery.isError ? (
          <div className="p-2 text-sm text-muted-foreground">Não foi possível carregar os canais.</div>
        ) : !channelsQuery.data?.length ? (
          <div className="p-2 text-sm text-muted-foreground">Nenhum canal encontrado.</div>
        ) : (
          <div className="grid gap-1">
            {channelsQuery.data.map((c) => {
              const active = c.id === value;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onChange(c)}
                  className={cn(
                    "w-full text-left rounded-lg border px-3 py-2 transition-colors",
                    "invictus-surface invictus-frame border-border/60",
                    active ? "ring-2 ring-ring" : "hover:bg-accent",
                  )}
                >
                  <div className="text-sm font-medium leading-tight">{c.name}</div>
                  {c.description ? <div className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{c.description}</div> : null}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
