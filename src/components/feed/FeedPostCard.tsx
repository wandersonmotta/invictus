import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { FeedPost } from "@/features/feed/types";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Heart, MessageCircle, MoreHorizontal, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/auth/AuthProvider";
import { toast } from "sonner";

import { FeedPostViewerDialog, type FeedPostWithUrls } from "@/components/feed/FeedPostViewerDialog";

function FeedPostCardInner({
  post,
  onPostDeleted,
}: {
  post: FeedPost & {
    media_urls: {
      url: string;
      contentType: string | null;
      trimStartSeconds?: number | null;
      trimEndSeconds?: number | null;
    }[];
  };
  onPostDeleted?: () => void;
}) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [viewerOpen, setViewerOpen] = React.useState(false);
  const [initialFocus, setInitialFocus] = React.useState<"comment" | "none">("none");
  const [deleting, setDeleting] = React.useState(false);

  const isMyPost = user?.id === post.author_user_id;

  const handleDelete = async () => {
    if (!isMyPost) return;
    setDeleting(true);
    const { error } = await supabase.rpc("delete_feed_post", { p_post_id: post.post_id });
    setDeleting(false);
    if (error) {
      toast.error("Não foi possível excluir");
      return;
    }
    toast.success("Publicação excluída");
    onPostDeleted?.();
    qc.invalidateQueries({ queryKey: ["feed_posts"] });
  };

  const likeMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("toggle_feed_post_like", { p_post_id: post.post_id });
      if (error) throw error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["feed_posts"] });
    },
  });

  const primary = post.media_urls[0];
  const authorHref = post.author_username
    ? `/membro/${encodeURIComponent(post.author_username.replace(/^@/, ""))}`
    : null;

  const isVideo = Boolean(primary?.contentType?.startsWith("video/"));
  const videoRef = React.useRef<HTMLVideoElement | null>(null);

  React.useEffect(() => {
    if (!viewerOpen) {
      setInitialFocus("none");
    }
  }, [viewerOpen]);

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

          {isMyPost && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" disabled={deleting}>
                  <MoreHorizontal className="h-5 w-5" />
                  <span className="sr-only">Opções</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {primary ? (
          <button
            type="button"
            onClick={() => {
              setInitialFocus("none");
              setViewerOpen(true);
            }}
            className="block w-full bg-muted"
            aria-label="Abrir publicação"
          >
            <div className="max-h-[70svh] w-full overflow-hidden">
              {isVideo ? (
                <video
                  ref={videoRef}
                  src={primary.url}
                  className="mx-auto block w-full max-h-[70svh] object-contain"
                  playsInline
                  controls
                  preload="metadata"
                />
              ) : (
                <img
                  src={primary.url}
                  alt={`Mídia de ${post.author_display_name}`}
                  className="mx-auto block w-full max-h-[70svh] object-contain"
                  loading="lazy"
                />
              )}
            </div>
          </button>
        ) : null}

        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => likeMutation.mutate()}
              aria-label={post.liked_by_me ? "Descurtir" : "Curtir"}
              disabled={likeMutation.isPending}
            >
              <Heart className={post.liked_by_me ? "fill-current" : ""} />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => {
                setInitialFocus("comment");
                setViewerOpen(true);
              }}
              aria-label="Comentar"
            >
              <MessageCircle />
            </Button>
          </div>

          <button
            type="button"
            onClick={() => {
              setInitialFocus("comment");
              setViewerOpen(true);
            }}
            className="text-xs text-muted-foreground hover:underline"
          >
            Ver comentários ({post.comment_count})
          </button>
        </div>

        <div className="px-4 pb-3 text-sm">
          <span className="font-semibold">{post.like_count}</span> <span className="text-muted-foreground">curtidas</span>
        </div>

        {post.caption ? (
          <div className="px-4 pb-4 text-sm text-foreground">
            <span className="font-semibold">{post.author_username?.replace(/^@/, "") ?? post.author_display_name}</span>
            <span className="ml-2 whitespace-pre-wrap break-words">{post.caption}</span>
          </div>
        ) : (
          <div className="pb-2" />
        )}

        <FeedPostViewerDialog
          open={viewerOpen}
          onOpenChange={setViewerOpen}
          post={post as unknown as FeedPostWithUrls}
          initialFocus={initialFocus}
          onPostDeleted={onPostDeleted}
        />
      </CardContent>
    </Card>
  );
}

// Memoizado para evitar re-renders quando a lista atualiza
export const FeedPostCard = React.memo(FeedPostCardInner);
