import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { FeedComment } from "@/features/feed/types";

import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";

export function CommentsDrawer({ postId, count }: { postId: string; count: number }) {
  const [open, setOpen] = React.useState(false);
  const [body, setBody] = React.useState("");
  const qc = useQueryClient();
  const { toast } = useToast();

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
                commentsQuery.data.map((c) => (
                  <div key={c.comment_id} className="flex gap-3">
                    {c.author_avatar_url ? (
                      <img
                        src={c.author_avatar_url}
                        alt={`Avatar de ${c.author_display_name}`}
                        className="h-8 w-8 rounded-full border border-border/70 object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full border border-border/70 invictus-surface" />
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">{c.author_display_name}</span>
                        {c.author_username ? <span className="ml-2">{c.author_username}</span> : null}
                      </div>
                      <div className="text-sm text-foreground">{c.body}</div>
                    </div>
                  </div>
                ))
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
