import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { FeedComment } from "@/features/feed/types";

import { FeedCommentRow } from "@/components/feed/FeedCommentRow";
import { FeedCommentComposer } from "@/components/feed/FeedCommentComposer";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { Trash2 } from "lucide-react";

export type PostCommentsPanelAuthor = {
  displayName: string;
  username: string | null;
  avatarUrl: string | null;
};

export type PostCommentsPanelProps = {
  postId: string;
  authorUserId?: string;
  author: PostCommentsPanelAuthor;
  caption: string | null;
  likeCount: number;
  likedByMe: boolean;
  commentCount: number;
  autoFocusComposer?: boolean;
  onCommentCountChange?: (delta: number) => void;
  onPostLikeChange?: (next: { likeCount: number; likedByMe: boolean }) => void;
  onPostDeleted?: () => void;
};

export function PostCommentsPanel({
  postId,
  authorUserId,
  author,
  caption,
  likeCount,
  likedByMe,
  commentCount,
  autoFocusComposer,
  onCommentCountChange,
  onPostLikeChange,
  onPostDeleted,
}: PostCommentsPanelProps) {
  const [body, setBody] = React.useState("");
  const composerRef = React.useRef<HTMLInputElement | null>(null);
  const [myUserId, setMyUserId] = React.useState<string | null>(null);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editBody, setEditBody] = React.useState("");
  const [confirmDeleteOpen, setConfirmDeleteOpen] = React.useState(false);
  const qc = useQueryClient();
  const { toast } = useToast();

  const isAuthor = Boolean(myUserId && authorUserId && myUserId === authorUserId);

  React.useEffect(() => {
    let mounted = true;
    supabase.auth
      .getUser()
      .then(({ data }) => {
        if (!mounted) return;
        setMyUserId(data.user?.id ?? null);
      })
      .catch(() => {
        if (!mounted) return;
        setMyUserId(null);
      });
    return () => {
      mounted = false;
    };
  }, []);

  React.useEffect(() => {
    if (!autoFocusComposer) return;
    queueMicrotask(() => composerRef.current?.focus());
  }, [autoFocusComposer, postId]);

  const commentsQuery = useQuery({
    queryKey: ["feed_comments", postId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("list_feed_post_comments", { p_post_id: postId, p_limit: 200 });
      if (error) throw error;
      return (data ?? []) as unknown as FeedComment[];
    },
    staleTime: 10_000,
  });

  const invalidateEverywhere = React.useCallback(async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["feed_comments", postId] }),
      qc.invalidateQueries({ queryKey: ["feed_posts"] }),
      qc.invalidateQueries({ queryKey: ["profile_feed"], exact: false }),
      qc.invalidateQueries({ queryKey: ["my-profile-feed"], exact: false }),
    ]);
  }, [qc, postId]);

  const addMutation = useMutation({
    mutationFn: async () => {
      const v = body.trim();
      if (!v) return;
      const { error } = await supabase.rpc("add_feed_post_comment", { p_post_id: postId, p_body: v });
      if (error) throw error;
    },
    onSuccess: async () => {
      setBody("");
      onCommentCountChange?.(1);
      await invalidateEverywhere();
      queueMicrotask(() => composerRef.current?.focus());
    },
    onError: (e: any) => toast({ title: "Não foi possível comentar", description: e?.message, variant: "destructive" }),
  });

  const editMutation = useMutation({
    mutationFn: async ({ commentId, newBody }: { commentId: string; newBody: string }) => {
      const v = newBody.trim();
      if (!v) throw new Error("Comentário vazio");
      const { error } = await supabase.rpc("edit_feed_post_comment", { p_comment_id: commentId, p_body: v });
      if (error) throw error;
    },
    onSuccess: async () => {
      setEditingId(null);
      setEditBody("");
      await qc.invalidateQueries({ queryKey: ["feed_comments", postId] });
      toast({ title: "Comentário editado" });
    },
    onError: (e: any) => toast({ title: "Não foi possível editar", description: e?.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const { data, error } = await supabase.rpc("delete_feed_post_comment", { p_comment_id: commentId });
      if (error) throw error;
      if (!data) throw new Error("Comentário não encontrado ou sem permissão");
    },
    onSuccess: async () => {
      onCommentCountChange?.(-1);
      await invalidateEverywhere();
      toast({ title: "Comentário apagado" });
    },
    onError: (e: any) => toast({ title: "Não foi possível apagar", description: e?.message, variant: "destructive" }),
  });

  const likeCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase.rpc("toggle_feed_comment_like", { p_comment_id: commentId });
      if (error) throw error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["feed_comments", postId] });
    },
    onError: (e: any) => toast({ title: "Não foi possível curtir", description: e?.message, variant: "destructive" }),
  });

  const likePostMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("toggle_feed_post_like", { p_post_id: postId });
      if (error) throw error;
    },
    onSuccess: async () => {
      const next = { likeCount: Math.max(0, likeCount + (likedByMe ? -1 : 1)), likedByMe: !likedByMe };
      onPostLikeChange?.(next);
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["feed_posts"] }),
        qc.invalidateQueries({ queryKey: ["profile_feed"], exact: false }),
        qc.invalidateQueries({ queryKey: ["my-profile-feed"], exact: false }),
      ]);
    },
    onError: (e: any) => toast({ title: "Não foi possível curtir", description: e?.message, variant: "destructive" }),
  });

  const deletePostMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("delete_feed_post", { p_post_id: postId });
      if (error) throw error;
    },
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["feed_posts"] }),
        qc.invalidateQueries({ queryKey: ["profile_feed"], exact: false }),
        qc.invalidateQueries({ queryKey: ["my-profile-feed"], exact: false }),
      ]);
      toast({ title: "Publicação excluída" });
      onPostDeleted?.();
    },
    onError: (e: any) => toast({ title: "Não foi possível excluir", description: e?.message, variant: "destructive" }),
  });

  return (
    <>
      <aside className="flex h-full min-h-0 flex-col invictus-surface invictus-frame border-t border-border/70 md:border-t-0 md:border-l">
      <div className="flex items-center gap-3 px-4 py-3">
        {author.avatarUrl ? (
          <img
            src={author.avatarUrl}
            alt={`Avatar de ${author.displayName}`}
            className="h-8 w-8 rounded-full border border-border/70 object-cover"
            loading="lazy"
          />
        ) : (
          <div className="h-8 w-8 rounded-full border border-border/70 invictus-surface" />
        )}

        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-foreground">{author.displayName}</div>
          {author.username ? <div className="truncate text-xs text-muted-foreground">{author.username}</div> : null}
        </div>
      </div>

      <Separator className="bg-border/60" />

      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
        <Button
          type="button"
          variant={likedByMe ? "secondary" : "ghost"}
          onClick={() => likePostMutation.mutate()}
          disabled={likePostMutation.isPending}
        >
          Curtir ({likeCount})
        </Button>

        <div className="text-xs text-muted-foreground">Comentários: {commentCount}</div>

        {isAuthor && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => setConfirmDeleteOpen(true)}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Excluir
          </Button>
        )}
      </div>

      <Separator className="bg-border/60" />

      <div className="min-h-0 flex-1">
        <ScrollArea className="h-full">
          <div className="space-y-3 px-4 py-4">
            {caption ? (
              <div className="text-sm text-foreground leading-snug">
                <span className="font-semibold">{author.username?.replace(/^@/, "") ?? author.displayName}</span>
                <span className="ml-2 whitespace-pre-wrap break-words">{caption}</span>
              </div>
            ) : null}

            {commentsQuery.isLoading ? (
              <div className="text-sm text-muted-foreground">Carregando…</div>
            ) : commentsQuery.isError ? (
              <div className="text-sm text-muted-foreground">Não foi possível carregar.</div>
            ) : commentsQuery.data?.length ? (
              commentsQuery.data.map((c) => {
                const isMe = myUserId === c.author_user_id;
                const isEditing = editingId === c.comment_id;

                return (
                  <FeedCommentRow
                    key={c.comment_id}
                    comment={c}
                    isMe={isMe}
                    isEditing={isEditing}
                    editBody={editBody}
                    onEditBodyChange={setEditBody}
                    onStartEdit={() => {
                      setEditingId(c.comment_id);
                      setEditBody(c.body);
                    }}
                    onCancelEdit={() => {
                      setEditingId(null);
                      setEditBody("");
                    }}
                    onSaveEdit={() => editMutation.mutate({ commentId: c.comment_id, newBody: editBody })}
                    onDelete={() => deleteMutation.mutate(c.comment_id)}
                    onToggleLike={() => likeCommentMutation.mutate(c.comment_id)}
                    likeDisabled={likeCommentMutation.isPending}
                    editDisabled={editMutation.isPending}
                    deleteDisabled={deleteMutation.isPending}
                    saveDisabled={editMutation.isPending}
                  />
                );
              })
            ) : (
              <div className="text-sm text-muted-foreground">Seja o primeiro a comentar.</div>
            )}
          </div>
        </ScrollArea>
      </div>

      <Separator className="bg-border/60" />

      <div className="px-4 py-3">
        <FeedCommentComposer
          ref={composerRef}
          value={body}
          onChange={setBody}
          onSubmit={() => addMutation.mutate()}
          disabled={addMutation.isPending}
        />
      </div>
      </aside>

      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent className="invictus-surface invictus-frame border-border/70">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir publicação?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Sua publicação será removida do feed e do seu perfil.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletePostMutation.mutate()}
              disabled={deletePostMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletePostMutation.isPending ? "Excluindo…" : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
