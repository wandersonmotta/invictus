import * as React from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useAuth } from "@/auth/AuthProvider";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

import { NewMessageDialog } from "@/components/messages/NewMessageDialog";
import { ThreadList } from "@/components/messages/ThreadList";
import { ChatView } from "@/components/messages/ChatView";
import { EmptyChatState } from "@/components/messages/EmptyChatState";
import { StatusRow } from "@/components/messages/StatusRow";

type FolderTab = "inbox" | "requests";

export default function Mensagens() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { user } = useAuth();

  const [tab, setTab] = React.useState<FolderTab>("inbox");
  const [search, setSearch] = React.useState("");
  const [newMessageOpen, setNewMessageOpen] = React.useState(false);

  const selectedConversationId = conversationId ?? null;
  const showListPane = !isMobile || !selectedConversationId;
  const showChatPane = !isMobile || !!selectedConversationId;

  return (
    <main className="invictus-page">
      <header className="invictus-page-header">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="invictus-h1">Mensagens</h1>
          </div>

          <NewMessageDialog
            open={newMessageOpen}
            onOpenChange={setNewMessageOpen}
            onConversationCreated={(id) => {
              setNewMessageOpen(false);
              navigate(`/mensagens/${id}`);
            }}
          />
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-[420px_minmax(0,1fr)]">
        {showListPane ? (
          <div className="invictus-surface invictus-frame border-border/70 rounded-xl overflow-hidden">
            <div className="p-3 sm:p-4 border-b border-border/60">
              <Tabs value={tab} onValueChange={(v) => setTab(v as FolderTab)}>
                <TabsList className="invictus-surface invictus-frame bg-muted/20 h-11 w-full">
                  <TabsTrigger value="inbox" className="flex-1">Inbox</TabsTrigger>
                  <TabsTrigger value="requests" className="flex-1">Solicitações</TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="mt-3">
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Pesquisar"
                />
              </div>
            </div>

            <div className="p-3 sm:p-4 border-b border-border/60">
              <StatusRow />
            </div>

            <ThreadList
              folder={tab === "inbox" ? "inbox" : "requests"}
              search={search}
              selectedConversationId={selectedConversationId}
              onSelectConversation={(id) => navigate(`/mensagens/${id}`)}
            />
          </div>
        ) : null}

        {showChatPane ? (
          <div className="invictus-surface invictus-frame border-border/70 rounded-xl overflow-hidden">
            {selectedConversationId ? (
              <ChatView
                conversationId={selectedConversationId}
                meId={user?.id ?? ""}
                onBack={isMobile ? () => navigate("/mensagens") : undefined}
                onAccepted={() => {
                  // após aceitar, volta pro inbox
                  setTab("inbox");
                }}
              />
            ) : (
              <div className="p-5 sm:p-6">
                <EmptyChatState
                  onNewMessage={() => setNewMessageOpen(true)}
                  ctaLabel="Enviar mensagem"
                />
              </div>
            )}
          </div>
        ) : null}
      </section>

      {/* fallback: se por algum motivo não tiver user */}
      {!user ? (
        <div className="mt-4">
          <Button variant="secondary" onClick={() => navigate("/auth")}>Entrar</Button>
        </div>
      ) : null}
    </main>
  );
}
