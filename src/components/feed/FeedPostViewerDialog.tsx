import * as React from "react";

import type { FeedPost } from "@/features/feed/types";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  onPostDeleted?: () => void;
};

export function FeedPostViewerDialog({
  open,
  onOpenChange,
  post,
  initialFocus = "none",
  onPostLikeChange,
  onCommentCountChange,
  onPostDeleted,
}: Props) {
  const primary = post.media_urls?.[0];
  const isVideo = Boolean(primary?.contentType?.startsWith("video/"));
  const videoRef = React.useRef<HTMLVideoElement | null>(null);

  React.useEffect(() => {
    if (!isVideo) return;
    const el = videoRef.current;
    if (!el) return;

    const start = typeof primary?.trimStartSeconds === "number" ? primary.trimStartSeconds : null;
    const end = typeof primary?.trimEndSeconds === "number" ? primary.trimEndSeconds : null;

    const onLoaded = () => {
      if (start != null && Number.isFinite(start)) {
        try {
          el.currentTime = Math.max(0, start);
        } catch {
          // ignore
        }
      }
    };

    const onTimeUpdate = () => {
      if (end != null && Number.isFinite(end) && el.currentTime >= end) {
        el.pause();
      }
    };

    el.addEventListener("loadedmetadata", onLoaded);
    el.addEventListener("timeupdate", onTimeUpdate);
    return () => {
      el.removeEventListener("loadedmetadata", onLoaded);
      el.removeEventListener("timeupdate", onTimeUpdate);
    };
  }, [isVideo, primary?.trimStartSeconds, primary?.trimEndSeconds, primary?.url]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-[min(80vh,720px)] w-[min(935px,calc(100vw-1.5rem))] max-w-none self-center mt-0 overflow-hidden p-0 invictus-surface invictus-frame border-border/70">
        <DialogHeader className="sr-only">
          <DialogTitle>Publicação</DialogTitle>
          <DialogDescription>Visualização da publicação com mídia e comentários.</DialogDescription>
        </DialogHeader>

        <div className="flex h-full min-h-0 flex-col md:grid md:grid-cols-[minmax(0,1fr)_420px]">
          <div className="h-[45vh] min-h-0 border-b border-border/60 md:h-auto md:border-b-0 md:border-r">
            <div className="h-full w-full bg-muted">
              {primary ? (
                <div className="flex h-full w-full items-center justify-center">
                  {isVideo ? (
                    <video
                      ref={videoRef}
                      src={primary.url}
                      className="max-h-full max-w-full object-contain"
                      playsInline
                      controls
                      preload="metadata"
                    />
                  ) : (
                    <img
                      src={primary.url}
                      alt={`Mídia de ${post.author_display_name}`}
                      className="max-h-full max-w-full object-contain"
                      loading="lazy"
                    />
                  )}
                </div>
              ) : (
                <div className="flex h-full w-full items-center justify-center p-6 text-sm text-muted-foreground">
                  Carregando mídia…
                </div>
              )}
            </div>
          </div>

          <PostCommentsPanel
            postId={post.post_id}
            authorUserId={post.author_user_id}
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
            onPostDeleted={() => {
              onOpenChange(false);
              onPostDeleted?.();
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
