import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { FeedPost } from "@/features/feed/types";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { ReelsMedia } from "@/components/feed/ReelsMedia";
import { CommentsDrawer } from "@/components/feed/CommentsDrawer";

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

  return (
    <Card className="invictus-surface invictus-frame border-border/70">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center gap-3">
          {post.author_avatar_url ? (
            <img
              src={post.author_avatar_url}
              alt={`Avatar de ${post.author_display_name}`}
              className="h-9 w-9 rounded-full border border-border/70 object-cover"
              loading="lazy"
            />
          ) : (
            <div className="h-9 w-9 rounded-full border border-border/70 invictus-surface" />
          )}

          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">{post.author_display_name}</div>
            {post.author_username ? <div className="truncate text-xs text-muted-foreground">{post.author_username}</div> : null}
          </div>
        </div>

        {primary ? (
          <ReelsMedia
            url={primary.url}
            contentType={primary.contentType}
            trimStartSeconds={primary.trimStartSeconds ?? null}
            trimEndSeconds={primary.trimEndSeconds ?? null}
            alt={`Mídia de ${post.author_display_name}`}
          />
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant={post.liked_by_me ? "secondary" : "ghost"} onClick={() => likeMutation.mutate()}>
            Curtir ({post.like_count})
          </Button>
          <CommentsDrawer postId={post.post_id} count={post.comment_count} />
        </div>

        {post.caption ? <div className="text-sm text-foreground whitespace-pre-wrap">{post.caption}</div> : null}
      </CardContent>
    </Card>
  );
}
