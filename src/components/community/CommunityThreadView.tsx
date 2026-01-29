import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { CommunityAttachment, CommunityPost } from "@/components/community/types";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

type Props = {
  threadId: string;
  onBack?: () => void;
};

function formatPt(dateIso: string) {
  try {
    return new Date(dateIso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return dateIso;
  }
}

function bytesToHuman(bytes: number | null | undefined) {
  if (!bytes && bytes !== 0) return "";
  const units = ["B", "KB", "MB", "GB"];
  let v = bytes;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function CommunityThreadView({ threadId, onBack }: Props) {
  const qc = useQueryClient();
  const [body, setBody] = React.useState("");
  const [pendingFiles, setPendingFiles] = React.useState<File[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [nowTick, setNowTick] = React.useState(() => Date.now());
  const [meId, setMeId] = React.useState<string | null>(null);
  const [activeUsers, setActiveUsers] = React.useState<
    { user_id: string; display_name: string; avatar_url: string | null }[]
  >([]);

  React.useEffect(() => {
    const t = window.setInterval(() => setNowTick(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!cancelled) setMeId(data.user?.id ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const threadQuery = useQuery({
    queryKey: ["community", "thread", threadId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_community_thread", { p_thread_id: threadId });
      if (error) throw error;
      return (data?.[0] ?? null) as any;
    },
    staleTime: 10_000,
  });

  const postsQuery = useQuery({
    queryKey: ["community", "posts", threadId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("list_community_posts", { p_thread_id: threadId, p_limit: 80 });
      if (error) throw error;
      return (data ?? []) as CommunityPost[];
    },
    staleTime: 0,
  });

  React.useEffect(() => {
    const channel = supabase
      .channel(`community-posts:${threadId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "community_posts",
          filter: `thread_id=eq.${threadId}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: ["community", "posts", threadId] });
          qc.invalidateQueries({ queryKey: ["community", "threads"] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc, threadId]);

  // Presença: mostra avatares de quem está com o canal aberto
  React.useEffect(() => {
    if (!meId) return;

    const presence = supabase.channel(`community-presence:${threadId}`, {
      config: { presence: { key: meId } },
    });

    const sync = async () => {
      const state = presence.presenceState() as Record<string, Array<{ user_id?: string }>>;
      const ids = Array.from(
        new Set(
          Object.values(state)
            .flat()
            .map((x) => x.user_id)
            .filter(Boolean) as string[],
        ),
      );

      if (!ids.length) {
        setActiveUsers([]);
        return;
      }

      const { data, error } = await supabase.rpc("list_safe_author_cards", { p_user_ids: ids });
      if (error) return;

      setActiveUsers(
        (data ?? []).map((r: any) => ({
          user_id: r.user_id,
          display_name: r.display_name,
          avatar_url: r.avatar_url ?? null,
        })),
      );
    };

    presence
      .on("presence", { event: "sync" }, () => {
        void sync();
      })
      .subscribe(async (status) => {
        if (status !== "SUBSCRIBED") return;
        await presence.track({ user_id: meId });
      });

    return () => {
      supabase.removeChannel(presence);
    };
  }, [meId, threadId]);

  const createPostMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("create_community_post", { p_thread_id: threadId, p_body: body });
      if (error) throw error;
      return data as string; // post_id
    },
    onSuccess: async (postId) => {
      // upload anexos (se houver)
      if (pendingFiles.length) {
        for (const f of pendingFiles) {
          const ext = f.name.includes(".") ? f.name.split(".").pop() : "bin";
          const path = `${threadId}/${postId}/${crypto.randomUUID()}.${ext}`;
          const { error: uploadError } = await supabase.storage.from("community-attachments").upload(path, f, {
            contentType: f.type || undefined,
            upsert: false,
          });
          if (uploadError) throw uploadError;

          const { error: metaError } = await supabase.rpc("add_community_post_attachment", {
            p_post_id: postId,
            p_storage_path: path,
            p_file_name: f.name,
            p_content_type: f.type || null,
            p_size_bytes: f.size,
          });
          if (metaError) throw metaError;
        }
      }

      setBody("");
      setPendingFiles([]);
      await qc.invalidateQueries({ queryKey: ["community", "posts", threadId] });
      await qc.invalidateQueries({ queryKey: ["community", "threads"] });
    },
  });

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 sm:p-4 border-b border-border/60">
        <div className="flex items-start gap-3">
          {onBack ? (
            <Button size="sm" variant="secondary" onClick={onBack}>
              Voltar
            </Button>
          ) : null}
          <div className="min-w-0">
            <div className="text-sm font-medium">
              {threadQuery.isLoading
                ? "Carregando…"
                : threadQuery.data?.channel_name
                  ? `#${threadQuery.data.channel_name}`
                  : "Canal"}
            </div>
            <div className="mt-1 flex items-center gap-2">
              <div className="text-xs text-muted-foreground">Ativos</div>
              {activeUsers.length ? (
                <div className="flex -space-x-2">
                  {activeUsers.slice(0, 8).map((u) => (
                    <Avatar key={u.user_id} className="h-6 w-6 border border-border/70">
                      {u.avatar_url ? <AvatarImage src={u.avatar_url} alt={`Avatar de ${u.display_name}`} /> : null}
                      <AvatarFallback>{(u.display_name || "M").slice(0, 1).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  ))}
                  {activeUsers.length > 8 ? (
                    <div className="ml-2 text-[11px] text-muted-foreground">+{activeUsers.length - 8}</div>
                  ) : null}
                </div>
              ) : (
                <div className="text-[11px] text-muted-foreground">—</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-3 sm:p-4">
        {postsQuery.isLoading ? (
          <div className="text-sm text-muted-foreground">Carregando posts…</div>
        ) : postsQuery.isError ? (
          <div className="text-sm text-muted-foreground">Não foi possível carregar este canal.</div>
        ) : !postsQuery.data?.length ? (
          <div className="text-sm text-muted-foreground">Ainda não há mensagens neste canal.</div>
        ) : (
          <div className="grid gap-3">
            {postsQuery.data.map((p) => (
              <PostItem key={p.post_id} post={p} meId={meId} nowTick={nowTick} />
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-border/60 p-3 sm:p-4">
        <div className="grid gap-2">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Escreva uma mensagem…"
            className="min-h-[84px]"
          />

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                  const files = Array.from(e.target.files ?? []);
                  setPendingFiles(files.slice(0, 10));
                }}
              />
              <Button
                type="button"
                size="sm"
                variant="goldOutline"
                onClick={() => fileInputRef.current?.click()}
              >
                Anexar arquivos
              </Button>
              <div className="text-xs text-muted-foreground">
                {pendingFiles.length ? `${pendingFiles.length} arquivo(s) selecionado(s)` : "Nenhum arquivo selecionado"}
              </div>
            </div>
            <Button
              onClick={() => createPostMutation.mutate()}
              disabled={createPostMutation.isPending || (!body.trim() && pendingFiles.length === 0)}
            >
              {createPostMutation.isPending ? "Enviando…" : "Enviar"}
            </Button>
          </div>

          <div className="text-[11px] text-muted-foreground">
            Dica: anexos ficam privados e só membros aprovados conseguem abrir.
          </div>
        </div>
      </div>
    </div>
  );
}

function PostItem({
  post,
  meId,
  nowTick,
}: {
  post: CommunityPost;
  meId: string | null;
  nowTick: number;
}) {
  const qc = useQueryClient();
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(post.body ?? "");

  React.useEffect(() => {
    // se chegar update via realtime/refresh, sincroniza rascunho quando não está editando
    if (!editing) setDraft(post.body ?? "");
  }, [post.body, editing]);

  const canModify = React.useMemo(() => {
    if (!meId) return false;
    if (post.author_id !== meId) return false;
    const created = new Date(post.created_at).getTime();
    return nowTick - created <= 40_000;
  }, [meId, nowTick, post.author_id, post.created_at]);

  const editMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("edit_community_post", { p_post_id: post.post_id, p_body: draft });
      if (error) throw error;
    },
    onSuccess: async () => {
      setEditing(false);
      await qc.invalidateQueries({ queryKey: ["community", "posts", post.thread_id] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("delete_community_post", { p_post_id: post.post_id });
      if (error) throw error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["community", "posts", post.thread_id] });
      await qc.invalidateQueries({ queryKey: ["community", "threads"] });
    },
  });

  const attachmentsQuery = useQuery({
    queryKey: ["community", "attachments", post.post_id],
    enabled: post.attachment_count > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("community_post_attachments")
        .select("*")
        .eq("post_id", post.post_id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as CommunityAttachment[];
    },
    staleTime: 60_000,
  });

  return (
    <div className={cn("rounded-xl border p-3 sm:p-4", "invictus-surface invictus-frame border-border/70")}>
      <div className="flex items-start gap-3">
        <Avatar className="h-9 w-9 border border-border/70">
          {post.author_avatar_url ? <AvatarImage src={post.author_avatar_url} alt={`Avatar de ${post.author_display_name}`} /> : null}
          <AvatarFallback>{(post.author_display_name || "M").slice(0, 1).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <div className="text-sm font-medium truncate">{post.author_display_name}</div>
                {post.author_username ? <div className="text-xs text-muted-foreground">{post.author_username}</div> : null}
                <div className="text-xs text-muted-foreground">• {formatPt(post.created_at)}</div>
                {canModify ? <div className="text-[11px] text-muted-foreground">(editável por 40s)</div> : null}
              </div>
            </div>

            {canModify ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="goldOutline">
                    Ações
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="invictus-surface invictus-frame border-border/70">
                  <DropdownMenuItem onSelect={() => setEditing(true)}>Editar</DropdownMenuItem>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>Excluir</DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="invictus-surface invictus-frame border-border/70">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir mensagem?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Você só consegue excluir dentro de 40 segundos após enviar.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteMutation.mutate()}
                          disabled={deleteMutation.isPending}
                        >
                          {deleteMutation.isPending ? "Excluindo…" : "Excluir"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>

          {editing ? (
            <div className="mt-2 grid gap-2">
              <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} className="min-h-[84px]" />
              <div className="flex items-center justify-end gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setEditing(false);
                    setDraft(post.body ?? "");
                  }}
                >
                  Cancelar
                </Button>
                <Button size="sm" onClick={() => editMutation.mutate()} disabled={editMutation.isPending || !draft.trim()}>
                  {editMutation.isPending ? "Salvando…" : "Salvar"}
                </Button>
              </div>
            </div>
          ) : post.body ? (
            <div className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{post.body}</div>
          ) : null}

          {post.attachment_count > 0 ? (
            <div className="mt-3">
              <div className="text-xs text-muted-foreground">Anexos ({post.attachment_count})</div>
              {attachmentsQuery.isLoading ? (
                <div className="mt-1 text-xs text-muted-foreground">Carregando anexos…</div>
              ) : attachmentsQuery.isError ? (
                <div className="mt-1 text-xs text-muted-foreground">Não foi possível carregar anexos.</div>
              ) : (
                <div className="mt-2 flex flex-wrap gap-2">
                  {(attachmentsQuery.data ?? []).map((a) => (
                    <AttachmentChip key={a.id} att={a} />
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function AttachmentChip({ att }: { att: CommunityAttachment }) {
  const [loading, setLoading] = React.useState(false);

  const label = att.file_name ?? att.storage_path.split("/").pop() ?? "arquivo";

  return (
    <button
      type="button"
      className={cn(
        "text-left rounded-full border px-3 py-1.5 text-xs transition-colors",
        "invictus-surface invictus-frame border-border/60",
        "hover:bg-accent",
      )}
      onClick={async () => {
        try {
          setLoading(true);
          const { data, error } = await supabase.storage.from("community-attachments").createSignedUrl(att.storage_path, 60);
          if (error) throw error;
          window.open(data.signedUrl, "_blank", "noopener,noreferrer");
        } finally {
          setLoading(false);
        }
      }}
      disabled={loading}
      title={att.size_bytes ? `${label} (${bytesToHuman(att.size_bytes)})` : label}
    >
      <span className="font-medium">{loading ? "Abrindo…" : label}</span>
      {att.size_bytes ? <span className="ml-2 text-muted-foreground">{bytesToHuman(att.size_bytes)}</span> : null}
    </button>
  );
}
