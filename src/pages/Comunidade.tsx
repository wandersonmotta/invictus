import * as React from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";

import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";

import { ChannelList } from "@/components/community/ChannelList";
import { CommunityThreadList } from "@/components/community/CommunityThreadList";
import { CommunityThreadView } from "@/components/community/CommunityThreadView";
import { NewThreadDialog } from "@/components/community/NewThreadDialog";

import type { CommunityChannel } from "@/components/community/types";
import { supabase } from "@/integrations/supabase/client";

export default function Comunidade() {
  const { threadId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();

  // Se tem threadId na URL, ele tem prioridade sobre a navegação local
  const currentThreadId = threadId ?? null;

  // Estado local para controle do canal selecionado (navegação nível 1)
  // Tentamos recuperar do location.state (se voltarmos de um thread)
  const [selectedChannelId, setSelectedChannelId] = React.useState<string | null>(
    () => location.state?.channelId ?? null
  );
  const [channelData, setChannelData] = React.useState<CommunityChannel | null>(null);

  // Se entrar direto em um thread (link externo ou refresh), descobrimos o canal
  React.useEffect(() => {
    if (!currentThreadId) return;

    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.rpc("get_community_thread", { p_thread_id: currentThreadId });
      if (error || cancelled) return;
      const row = data?.[0];
      if (row?.channel_id) {
        setSelectedChannelId(row.channel_id);
        // Opcional: buscar dados do canal se precisarmos do nome no header
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [currentThreadId]);

  // View States
  // 1. Channel List (Root) -> !selectedChannelId && !currentThreadId
  // 2. Thread List (Channel) -> selectedChannelId && !currentThreadId
  // 3. Thread View (Chat) -> currentThreadId

  // Mobile vs Desktop
  // Mobile: mostra UM de cada vez.
  // Desktop: sidebar (Canais) sempre visível?
  // O layout atual sugere um painel principal. Vamos manter simples:
  // Mobile e Desktop com comportamento similar por enquanto, ou split view se houver espaço.
  // O código original usava `showListPane` e `showThreadPane`. Vamos adaptar.

  const isThreadView = !!currentThreadId;
  const isThreadList = !!selectedChannelId && !isThreadView;
  const isChannelList = !selectedChannelId && !isThreadView;

  // Render helpers
  const handleBackToChannels = () => {
    setSelectedChannelId(null);
    setChannelData(null);
    navigate("/comunidade");
  };

  const handleBackToThreads = () => {
    // Ao voltar do thread, mantemos o canal selecionado via state
    navigate("/comunidade", { state: { channelId: selectedChannelId } });
  };

  return (
    <main className="invictus-page h-[calc(100vh-4rem)] flex flex-col">
      <header className="invictus-page-header shrink-0">
        <h1 className="invictus-h1">Comunidade</h1>
        <p className="invictus-lead">Conecte-se com membros, compartilhe ideias e evolua.</p>
      </header>

      <section className="flex-1 min-h-0 grid gap-4">
        {/* Container principal com borda/fundo */}
        <div className="invictus-surface invictus-frame border-border/70 rounded-xl overflow-hidden h-full flex flex-col">
          
          {/* VIEW 1: Lista de Canais */}
          {isChannelList && (
            <ChannelList
              value={null}
              onChange={(channel) => {
                setChannelData(channel);
                setSelectedChannelId(channel.id);
              }}
            />
          )}

          {/* VIEW 2: Lista de Tópicos (Dentro de um canal) */}
          {isThreadList && (
            <div className="h-full flex flex-col">
              <div className="p-3 sm:p-4 border-b border-border/60 flex items-center gap-3">
                <Button variant="ghost" size="sm" onClick={handleBackToChannels}>
                  ← Canais
                </Button>
                <div className="font-medium">
                   {channelData ? channelData.name : "Tópicos"}
                </div>
              </div>

              <div className="flex-1 min-h-0">
                <CommunityThreadList
                  channelId={selectedChannelId}
                  selectedThreadId={null}
                  onSelectThread={(tId) => navigate(`/comunidade/${tId}`)}
                  rightSlot={
                    <NewThreadDialog
                      channelId={selectedChannelId}
                      onCreated={(newId) => navigate(`/comunidade/${newId}`)}
                    />
                  }
                />
              </div>
            </div>
          )}

          {/* VIEW 3: Chat do Tópico */}
          {isThreadView && (
            <CommunityThreadView
              threadId={currentThreadId}
              onBack={handleBackToThreads}
            />
          )}
        </div>
      </section>
    </main>
  );
}
