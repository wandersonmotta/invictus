import * as React from "react";

import type { FeedPost } from "@/features/feed/types";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ReelsMedia } from "@/components/feed/ReelsMedia";
import { PostCommentsPanel } from "@/components/feed/PostCommentsPanel";

export type FeedPostWithUrls = FeedPost & {
  media_urls: {
    url: string;
    contentType: string | null;
    trimStartSeconds?: number | null;
    trimEndSeconds?: number | null;
  }[];
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: FeedPostWithUrls;
  initialFocus?: "comment" | "none";
  onPostLikeChange?: (next: { likeCount: number; likedByMe: boolean }) => void;
  onCommentCountChange?: (delta: number) => void;
};

export function FeedPostViewerDialog({
  open,
  onOpenChange,
  post,
  initialFocus = "none",
  onPostLikeChange,
  onCommentCountChange,
}: Props) {
  const primary = post.media_urls?.[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-[min(80vh,720px)] w-[min(935px,calc(100vw-1.5rem))] max-w-none self-center mt-0 overflow-hidden p-0 invictus-surface invictus-frame border-border/70">
        <DialogHeader className="sr-only">
          <DialogTitle>Publicação</DialogTitle>
        </DialogHeader>

        <div className="flex h-full min-h-0 flex-col md:grid md:grid-cols-[minmax(0,1fr)_420px]">
          <div className="h-[45vh] min-h-0 border-b border-border/60 md:h-auto md:border-b-0 md:border-r">
            {primary ? (
              <ReelsMedia
                url={primary.url}
                contentType={primary.contentType}
                trimStartSeconds={primary.trimStartSeconds ?? null}
                trimEndSeconds={primary.trimEndSeconds ?? null}
                alt={`Mídia de ${post.author_display_name}`}
                className="h-full rounded-none border-0"
              />
            ) : (
              <div className="h-full bg-muted p-6 text-sm text-muted-foreground">Carregando mídia…</div>
            )}
          </div>

          <PostCommentsPanel
            postId={post.post_id}
            author={{
              displayName: post.author_display_name,
              username: post.author_username,
              avatarUrl: post.author_avatar_url,
            }}
            caption={post.caption}
            likeCount={post.like_count}
            likedByMe={post.liked_by_me}
            commentCount={post.comment_count}
            autoFocusComposer={initialFocus === "comment"}
            onPostLikeChange={onPostLikeChange}
            onCommentCountChange={onCommentCountChange}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
