import * as React from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useIsMobile } from "@/hooks/use-mobile";

import { ChannelList } from "@/components/community/ChannelList";
import { CommunityThreadView } from "@/components/community/CommunityThreadView";
import type { CommunityChannel } from "@/components/community/types";
import { supabase } from "@/integrations/supabase/client";

export default function Comunidade() {
  const { threadId } = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [channelId, setChannelId] = React.useState<string | null>(null);

  const ensureChannelThread = React.useCallback(
    async (channel: CommunityChannel) => {
      setChannelId(channel.id);

      // 1) tenta reaproveitar o primeiro thread (salinha) do canal
      const { data: threads, error: listErr } = await supabase.rpc("list_community_threads", {
        p_channel_id: channel.id,
        p_search: null,
        p_limit: 1,
        p_offset: 0,
      });
      if (listErr) throw listErr;

      const existing = threads?.[0]?.thread_id;
      if (existing) {
        navigate(`/comunidade/${existing}`);
        return;
      }

      // 2) se não existir ainda, cria automaticamente um thread único para o canal
      const { data: createdId, error: createErr } = await supabase.rpc("create_community_thread", {
        p_channel_id: channel.id,
        p_title: `Canal: ${channel.name}`,
        p_body: null,
      });
      if (createErr) throw createErr;
      navigate(`/comunidade/${createdId}`);
    },
    [navigate],
  );

  // Se a pessoa entrar direto em /comunidade/:threadId, marcamos o canal correto
  React.useEffect(() => {
    if (!threadId) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.rpc("get_community_thread", { p_thread_id: threadId });
      if (error) return;
      const row = data?.[0];
      if (!cancelled && row?.channel_id) setChannelId(row.channel_id);
    })();
    return () => {
      cancelled = true;
    };
  }, [threadId]);

  const selectedThreadId = threadId ?? null;
  const showListPane = !isMobile || !selectedThreadId;
  const showThreadPane = !isMobile || !!selectedThreadId;

  return (
    <main className="invictus-page">
      <header className="invictus-page-header">
        <h1 className="invictus-h1">Comunidade</h1>
        <p className="invictus-lead">Canais fixos com conversas entre membros aprovados.</p>
      </header>

      <section className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        {showListPane ? (
          <div className="invictus-surface invictus-frame border-border/70 rounded-xl overflow-hidden">
            <ChannelList
              value={channelId}
              onChange={(channel) => {
                // mobile: ao selecionar canal, já abre a conversa
                void ensureChannelThread(channel);
              }}
            />
          </div>
        ) : null}

        {showThreadPane ? (
          <div className="invictus-surface invictus-frame border-border/70 rounded-xl overflow-hidden">
            {selectedThreadId ? (
              <CommunityThreadView
                threadId={selectedThreadId}
                onBack={isMobile ? () => navigate("/comunidade") : undefined}
              />
            ) : (
              <div className="p-5 sm:p-6">
                <div className="text-sm font-medium">Selecione um canal</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  Escolha um canal para ver e participar da conversa.
                </div>
              </div>
            )}
          </div>
        ) : null}
      </section>
    </main>
  );
}
