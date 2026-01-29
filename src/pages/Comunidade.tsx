import * as React from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useIsMobile } from "@/hooks/use-mobile";

import { ChannelList } from "@/components/community/ChannelList";
import { CommunityThreadList } from "@/components/community/CommunityThreadList";
import { NewThreadDialog } from "@/components/community/NewThreadDialog";
import { CommunityThreadView } from "@/components/community/CommunityThreadView";

export default function Comunidade() {
  const { threadId } = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [channelId, setChannelId] = React.useState<string | null>(null);

  const selectedThreadId = threadId ?? null;
  const showListPane = !isMobile || !selectedThreadId;
  const showThreadPane = !isMobile || !!selectedThreadId;

  return (
    <main className="invictus-page">
      <header className="invictus-page-header">
        <h1 className="invictus-h1">Comunidade</h1>
        <p className="invictus-lead">Canais fixos com temas e conversas entre membros aprovados.</p>
      </header>

      <section className="grid gap-4 lg:grid-cols-[320px_420px_minmax(0,1fr)]">
        {showListPane ? (
          <div className="invictus-surface invictus-frame border-border/70 rounded-xl overflow-hidden">
            <ChannelList
              value={channelId}
              onChange={(id) => {
                setChannelId(id);
                if (isMobile) navigate("/comunidade");
              }}
            />
          </div>
        ) : null}

        {showListPane ? (
          <div className="invictus-surface invictus-frame border-border/70 rounded-xl overflow-hidden">
            <CommunityThreadList
              channelId={channelId}
              selectedThreadId={selectedThreadId}
              onSelectThread={(id) => navigate(`/comunidade/${id}`)}
              rightSlot={
                <NewThreadDialog
                  channelId={channelId}
                  onCreated={(id) => {
                    navigate(`/comunidade/${id}`);
                  }}
                />
              }
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
                <div className="text-sm font-medium">Selecione um tema</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  Escolha um canal, depois clique em um tema para ver e participar da conversa.
                </div>
              </div>
            )}
          </div>
        ) : null}
      </section>
    </main>
  );
}
