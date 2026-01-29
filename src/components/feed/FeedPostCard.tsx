import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { FeedPost } from "@/features/feed/types";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { ReelsMedia } from "@/components/feed/ReelsMedia";
import { CommentsDrawer } from "@/components/feed/CommentsDrawer";
import { Link } from "react-router-dom";

export function FeedPostCard({ post }: { post: FeedPost & { media_urls: { url: string; contentType: string | null }[] } }) {
  const qc = useQueryClient();

  const likeMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("toggle_feed_post_like", { p_post_id: post.post_id });
      if (error) throw error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["feed_posts"] });
    },
  });

  const primary = post.media_urls[0] as any;
  const authorHref = post.author_username
    ? `/membro/${encodeURIComponent(post.author_username.replace(/^@/, ""))}`
    : null;

  return (
    <Card className="invictus-surface invictus-frame border-border/70 mx-auto w-full max-w-[480px] overflow-hidden">
      <CardContent className="p-0">
        <div className="flex items-center gap-3 px-4 py-3">
          {authorHref ? (
            <Link
              to={authorHref}
              className="group flex min-w-0 flex-1 items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label={`Abrir perfil de ${post.author_display_name}`}
            >
              {post.author_avatar_url ? (
                <img
                  src={post.author_avatar_url}
                  alt={`Avatar de ${post.author_display_name}`}
                  className="h-8 w-8 rounded-full border border-border/70 object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="h-8 w-8 rounded-full border border-border/70 invictus-surface" />
              )}

              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium group-hover:underline">{post.author_display_name}</div>
                {post.author_username ? (
                  <div className="truncate text-xs text-muted-foreground">{post.author_username}</div>
                ) : null}
              </div>
            </Link>
          ) : (
            <>
              {post.author_avatar_url ? (
                <img
                  src={post.author_avatar_url}
                  alt={`Avatar de ${post.author_display_name}`}
                  className="h-8 w-8 rounded-full border border-border/70 object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="h-8 w-8 rounded-full border border-border/70 invictus-surface" />
              )}

              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{post.author_display_name}</div>
                {post.author_username ? (
                  <div className="truncate text-xs text-muted-foreground">{post.author_username}</div>
                ) : null}
              </div>
            </>
          )}
        </div>

        {primary ? (
          <ReelsMedia
            url={primary.url}
            contentType={primary.contentType}
            trimStartSeconds={primary.trimStartSeconds ?? null}
            trimEndSeconds={primary.trimEndSeconds ?? null}
            alt={`Mídia de ${post.author_display_name}`}
            className="rounded-none border-0"
          />
        ) : null}

        <div className="flex flex-wrap items-center gap-2 px-4 py-3">
          <Button type="button" variant={post.liked_by_me ? "secondary" : "ghost"} onClick={() => likeMutation.mutate()}>
            Curtir ({post.like_count})
          </Button>
          <CommentsDrawer postId={post.post_id} count={post.comment_count} />
        </div>

        {post.caption ? (
          <div className="px-4 pb-4 text-sm text-foreground whitespace-pre-wrap">{post.caption}</div>
        ) : (
          <div className="pb-2" />
        )}
      </CardContent>
    </Card>
  );
}
