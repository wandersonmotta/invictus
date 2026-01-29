import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { FeedComment } from "@/features/feed/types";

import { FeedCommentRow } from "@/components/feed/FeedCommentRow";

import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";

export function CommentsDrawer({ postId, count }: { postId: string; count: number }) {
  const [open, setOpen] = React.useState(false);
  const [body, setBody] = React.useState("");
  const [myUserId, setMyUserId] = React.useState<string | null>(null);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editBody, setEditBody] = React.useState("");
  const qc = useQueryClient();
  const { toast } = useToast();

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

  const commentsQuery = useQuery({
    queryKey: ["feed_comments", postId],
    enabled: open,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("list_feed_post_comments", { p_post_id: postId, p_limit: 200 });
      if (error) throw error;
      return (data ?? []) as unknown as FeedComment[];
    },
    staleTime: 10_000,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const v = body.trim();
      if (!v) return;
      const { error } = await supabase.rpc("add_feed_post_comment", { p_post_id: postId, p_body: v });
      if (error) throw error;
    },
    onSuccess: async () => {
      setBody("");
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["feed_comments", postId] }),
        qc.invalidateQueries({ queryKey: ["feed_posts"] }),
      ]);
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
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["feed_comments", postId] }),
        qc.invalidateQueries({ queryKey: ["feed_posts"] }),
      ]);
      toast({ title: "Comentário apagado" });
    },
    onError: (e: any) => toast({ title: "Não foi possível apagar", description: e?.message, variant: "destructive" }),
  });

  const likeMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase.rpc("toggle_feed_comment_like", { p_comment_id: commentId });
      if (error) throw error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["feed_comments", postId] });
    },
    onError: (e: any) => toast({ title: "Não foi possível curtir", description: e?.message, variant: "destructive" }),
  });

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button type="button" variant="ghost">
          Comentários ({count})
        </Button>
      </DrawerTrigger>
      <DrawerContent className="invictus-surface">
        <DrawerHeader>
          <DrawerTitle>Comentários</DrawerTitle>
        </DrawerHeader>

        <div className="px-4 pb-4">
          <ScrollArea className="h-[45vh] rounded-md border border-border/60">
            <div className="space-y-3 p-4">
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
                      onDelete={() => {
                        if (confirm("Apagar este comentário?")) {
                          deleteMutation.mutate(c.comment_id);
                        }
                      }}
                      onToggleLike={() => likeMutation.mutate(c.comment_id)}
                      likeDisabled={likeMutation.isPending}
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

          <div className="mt-3 flex gap-2">
            <Input value={body} onChange={(e) => setBody(e.target.value)} placeholder="Escreva um comentário…" />
            <Button type="button" onClick={() => addMutation.mutate()} disabled={addMutation.isPending}>
              Enviar
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
