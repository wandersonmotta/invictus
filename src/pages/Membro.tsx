import * as React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { createSignedUrl } from "@/features/feed/storage";
import type { FeedPost } from "@/features/feed/types";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ReelsMedia } from "@/components/feed/ReelsMedia";
import { PostCommentsPanel } from "@/components/feed/PostCommentsPanel";
import { ExpertisesChips } from "@/components/profile/ExpertisesChips";

type PublicProfile = {
  user_id: string;
  username: string | null;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  city: string | null;
  state: string | null;
  region: string | null;
  expertises: string[];
  profile_visibility: "members" | "mutuals" | "private";
  can_view: boolean;
};

export default function Membro() {
  const params = useParams();
  const navigate = useNavigate();
  const username = params.username ? `@${decodeURIComponent(params.username)}` : "";
  const [myUserId, setMyUserId] = React.useState<string | null>(null);
  const [viewerOpen, setViewerOpen] = React.useState(false);
  const [selectedPost, setSelectedPost] = React.useState<
    (FeedPost & { thumbUrl: string | null; firstType: string | null }) | null
  >(null);
  const [selectedMediaUrls, setSelectedMediaUrls] = React.useState<{ url: string; contentType: string | null }[]>([]);

  const profileQuery = useQuery({
    queryKey: ["public_profile", username],
    enabled: !!username,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_public_profile_by_username", { p_username: username });
      if (error) throw error;
      return (data?.[0] ?? null) as unknown as PublicProfile | null;
    },
    staleTime: 10_000,
  });

  const statsQuery = useQuery({
    queryKey: ["follow_stats", profileQuery.data?.user_id],
    enabled: !!profileQuery.data?.user_id,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_follow_stats", { p_user_id: profileQuery.data!.user_id });
      if (error) throw error;
      return (data?.[0] ?? { followers_count: 0, following_count: 0, is_following: false }) as any;
    },
    staleTime: 10_000,
  });

  const postsQuery = useQuery({
    queryKey: ["profile_feed", profileQuery.data?.user_id],
    enabled: !!profileQuery.data?.user_id && Boolean(profileQuery.data?.can_view),
    queryFn: async () => {
      const { data, error } = await supabase.rpc("list_profile_feed_posts", {
        p_user_id: profileQuery.data!.user_id,
        p_limit: 24,
        p_before: null,
      });
      if (error) throw error;
      const rows = (data ?? []) as unknown as FeedPost[];
      const withThumbs = await Promise.all(
        rows.map(async (p) => {
          const first = (p.media ?? [])[0];
          const thumbUrl = first ? await createSignedUrl("feed-media", first.storage_path) : null;
          return { ...p, thumbUrl, firstType: first?.content_type ?? null };
        }),
      );
      return withThumbs;
    },
    staleTime: 10_000,
  });

  const p = profileQuery.data;
  const s = statsQuery.data;
  const isMe = Boolean(myUserId && p?.user_id && myUserId === p.user_id);

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
    if (!viewerOpen) {
      setSelectedMediaUrls([]);
    }
  }, [viewerOpen]);

  return (
    <main className="invictus-page">
      <header className="invictus-page-header">
        <h1 className="invictus-h1">Perfil</h1>
        <p className="invictus-lead">Perfil público no estilo Instagram.</p>
      </header>

      {profileQuery.isLoading ? (
        <div className="text-sm text-muted-foreground">Carregando…</div>
      ) : profileQuery.isError ? (
        <div className="text-sm text-muted-foreground">Não foi possível carregar esse perfil.</div>
      ) : !p ? (
        <div className="text-sm text-muted-foreground">Perfil não encontrado.</div>
      ) : (
        <div className="space-y-4">
          <Card className="invictus-surface invictus-frame border-border/70">
            <CardContent className="p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <div className="flex items-center gap-3">
                  {p.avatar_url ? (
                    <img
                      src={p.avatar_url}
                      alt={`Avatar de ${p.display_name}`}
                      className="h-16 w-16 rounded-full border border-border/70 object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-full border border-border/70 invictus-surface" />
                  )}
                  <div className="min-w-0">
                    <div className="truncate text-lg font-semibold">{p.display_name}</div>
                    {p.username ? <div className="truncate text-sm text-muted-foreground">{p.username}</div> : null}
                    <div className="mt-1 text-xs text-muted-foreground">
                      {p.city || p.state ? (
                        <span>
                          {p.city ?? "—"}
                          {p.state ? `/${p.state}` : ""}
                        </span>
                      ) : (
                        <span>Localização não informada</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-1 flex-col gap-3 sm:items-end">
                  <div className="flex flex-wrap gap-2">
                    {isMe ? (
                      <Button type="button" variant="secondary" onClick={() => navigate("/perfil")}>
                        Editar perfil
                      </Button>
                    ) : (
                      <>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={async () => {
                            await supabase.rpc("toggle_follow", { p_target_user_id: p.user_id });
                            await statsQuery.refetch();
                          }}
                        >
                          {s?.is_following ? "Seguindo" : "Seguir"}
                        </Button>

                        <Button
                          type="button"
                          onClick={async () => {
                            const { data: auth } = await supabase.auth.getUser();
                            const me = auth.user?.id;
                            if (!me) return;
                            const { data, error } = await supabase.rpc("create_conversation", {
                              p_type: "direct",
                              p_member_ids: [me, p.user_id],
                            });
                            if (error) throw error;
                            navigate(`/mensagens/${data as unknown as string}`);
                          }}
                        >
                          Mensagem
                        </Button>
                      </>
                    )}
                  </div>

                  <div className="flex gap-6 text-sm">
                    <div>
                      <div className="font-semibold">{postsQuery.data?.length ?? 0}</div>
                      <div className="text-xs text-muted-foreground">Posts</div>
                    </div>
                    <div>
                      <div className="font-semibold">{s?.followers_count ?? 0}</div>
                      <div className="text-xs text-muted-foreground">Seguidores</div>
                    </div>
                    <div>
                      <div className="font-semibold">{s?.following_count ?? 0}</div>
                      <div className="text-xs text-muted-foreground">Seguindo</div>
                    </div>
                  </div>
                </div>
              </div>

              {p.bio ? <div className="mt-4 whitespace-pre-wrap text-sm text-foreground">{p.bio}</div> : null}
              <ExpertisesChips items={p.expertises} />
            </CardContent>
          </Card>

          {!p.can_view ? (
            <Card className="invictus-surface invictus-frame border-border/70">
              <CardContent className="p-4 text-sm text-muted-foreground">Este perfil é privado.</CardContent>
            </Card>
          ) : postsQuery.isLoading ? (
            <div className="text-sm text-muted-foreground">Carregando posts…</div>
          ) : postsQuery.isError ? (
            <div className="text-sm text-muted-foreground">Não foi possível carregar os posts.</div>
          ) : (
            <section className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
              {postsQuery.data?.map((post: any) => (
                <button
                  key={post.post_id}
                  type="button"
                  className="aspect-square overflow-hidden rounded-md border border-border/60 bg-muted"
                  onClick={async () => {
                    setSelectedPost(post);
                    setViewerOpen(true);
                    const urls = await Promise.all(
                      (post.media ?? []).map(async (m: any) => ({
                        url: await createSignedUrl("feed-media", m.storage_path),
                        contentType: m.content_type,
                      })),
                    );
                    setSelectedMediaUrls(urls);
                  }}
                  title="Abrir post"
                >
                  {post.thumbUrl ? (
                    <img
                      src={post.thumbUrl}
                      alt="Miniatura do post"
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : null}
                </button>
              ))}
            </section>
          )}

          <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
            <DialogContent
              className="h-[85vh] w-[min(1100px,calc(100vw-1.5rem))] overflow-hidden p-0 invictus-surface invictus-frame border-border/70"
            >
              <DialogHeader className="sr-only">
                <DialogTitle>Publicação</DialogTitle>
              </DialogHeader>

              {selectedPost ? (
                <div className="flex h-full min-h-0 flex-col md:grid md:grid-cols-[minmax(0,1fr)_420px]">
                  <div className="h-[45vh] min-h-0 border-b border-border/60 md:h-auto md:border-b-0 md:border-r">
                    {selectedMediaUrls[0] ? (
                      <ReelsMedia
                        url={selectedMediaUrls[0].url}
                        contentType={selectedMediaUrls[0].contentType}
                        trimStartSeconds={(selectedPost.media?.[0] as any)?.trim_start_seconds ?? null}
                        trimEndSeconds={(selectedPost.media?.[0] as any)?.trim_end_seconds ?? null}
                        alt="Mídia do post"
                        className="h-full rounded-none border-0"
                      />
                    ) : (
                      <div className="rounded-xl border border-border/60 bg-muted p-6 text-sm text-muted-foreground">
                        Carregando mídia…
                      </div>
                    )}
                  </div>

                  <PostCommentsPanel
                    postId={selectedPost.post_id}
                    author={{ displayName: p.display_name, username: p.username, avatarUrl: p.avatar_url }}
                    caption={selectedPost.caption}
                    likeCount={selectedPost.like_count}
                    likedByMe={selectedPost.liked_by_me}
                    commentCount={selectedPost.comment_count}
                    onPostLikeChange={(next) =>
                      setSelectedPost((prev) => (prev ? { ...prev, like_count: next.likeCount, liked_by_me: next.likedByMe } : prev))
                    }
                    onCommentCountChange={(delta) =>
                      setSelectedPost((prev) => (prev ? { ...prev, comment_count: Math.max(0, prev.comment_count + delta) } : prev))
                    }
                  />
                </div>
              ) : null}
            </DialogContent>
          </Dialog>
        </div>
      )}
    </main>
  );
}
