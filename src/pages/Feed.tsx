import * as React from "react";
import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { FeedMode, FeedPost } from "@/features/feed/types";
import { createSignedUrl } from "@/features/feed/storage";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NewFeedPostDialog } from "@/components/feed/NewFeedPostDialog";
import { FeedPostCard } from "@/components/feed/FeedPostCard";

export default function Feed() {
  const [mode, setMode] = React.useState<FeedMode>("all");

  const feedQuery = useQuery({
    queryKey: ["feed_posts", mode],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("list_feed_posts", {
        p_mode: mode,
        p_limit: 15,
        p_before: null,
      });
      if (error) throw error;

      const rows = (data ?? []) as unknown as FeedPost[];
      const withUrls = await Promise.all(
        rows.map(async (p) => {
          const media_urls = await Promise.all(
            (p.media ?? []).map(async (m) => ({
              url: await createSignedUrl("feed-media", m.storage_path),
              contentType: m.content_type,
              trimStartSeconds: m.trim_start_seconds ?? null,
              trimEndSeconds: m.trim_end_seconds ?? null,
            })),
          );
          return { ...p, media_urls };
        }),
      );

      return withUrls;
    },
    staleTime: 10_000,
  });

  return (
    <main className="invictus-page">
      <header className="invictus-page-header flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="invictus-h1">Feed</h1>
          <p className="invictus-lead">Publicações em estilo Reels (fotos e vídeos).</p>
        </div>

        <div className="flex items-center gap-2">
          <Tabs value={mode} onValueChange={(v) => setMode(v as FeedMode)}>
            <TabsList>
              <TabsTrigger value="all">Todos</TabsTrigger>
              <TabsTrigger value="following">Seguindo</TabsTrigger>
            </TabsList>
          </Tabs>
          <NewFeedPostDialog />
        </div>
      </header>

      <section className="space-y-4">
        {feedQuery.isLoading ? (
          <div className="text-sm text-muted-foreground">Carregando…</div>
        ) : feedQuery.isError ? (
          <div className="text-sm text-muted-foreground">Não foi possível carregar o feed.</div>
        ) : feedQuery.data?.length ? (
          feedQuery.data.map((p) => <FeedPostCard key={p.post_id} post={p} />)
        ) : (
          <div className="text-sm text-muted-foreground">Ainda não há posts aqui.</div>
        )}
      </section>
    </main>
  );
}
