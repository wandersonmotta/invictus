import * as React from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ExpertisesChips } from "@/components/profile/ExpertisesChips";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type PublicProfile = {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  bio: string;
  city: string;
  state: string;
  expertises: string[];
};

export function MemberQuickProfileDialog({
  userId,
  open,
  onOpenChange,
}: {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const profileQuery = useQuery({
    queryKey: ["get_public_profile", userId],
    enabled: open && !!userId,
    staleTime: 60_000,
    queryFn: async (): Promise<PublicProfile | null> => {
      if (!userId) return null;
      const { data, error } = await supabase.rpc("get_public_profile", { p_user_id: userId });
      if (error) throw error;
      const row = (data ?? [])[0] as unknown as PublicProfile | undefined;
      return row ?? null;
    },
  });

  const followStatsQuery = useQuery({
    queryKey: ["get_follow_stats", userId],
    enabled: open && !!userId,
    staleTime: 10_000,
    queryFn: async () => {
      if (!userId) return { is_following: false };
      const { data, error } = await supabase.rpc("get_follow_stats", { p_user_id: userId });
      if (error) throw error;
      const row = (data ?? [])[0] as unknown as { is_following: boolean } | undefined;
      return { is_following: !!row?.is_following };
    },
  });

  const toggleFollow = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("missing userId");
      const { data, error } = await supabase.rpc("toggle_follow", { p_target_user_id: userId });
      if (error) throw error;
      return Boolean(data);
    },
    onSuccess: () => {
      void followStatsQuery.refetch();
    },
    onError: (e: any) => {
      toast({ title: "Não foi possível seguir", description: String(e?.message ?? e), variant: "destructive" });
    },
  });

  const createConversation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("missing auth");
      if (!userId) throw new Error("missing userId");
      const { data, error } = await supabase.rpc("create_conversation", {
        p_type: "direct",
        p_member_ids: [user.id, userId],
        p_group_name: null,
      });
      if (error) throw error;
      return String(data);
    },
    onSuccess: (conversationId) => {
      onOpenChange(false);
      navigate(`/mensagens/${conversationId}`);
    },
    onError: (e: any) => {
      toast({ title: "Não foi possível iniciar conversa", description: String(e?.message ?? e), variant: "destructive" });
    },
  });

  const p = profileQuery.data;
  const isFollowing = followStatsQuery.data?.is_following ?? false;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-0 bg-transparent p-0 shadow-none">
        <div className="invictus-modal-glass invictus-frame p-5">
          <DialogHeader>
            <DialogTitle>Perfil</DialogTitle>
          </DialogHeader>

          {profileQuery.isLoading ? (
            <div className="mt-4 text-sm text-muted-foreground">Carregando…</div>
          ) : profileQuery.isError || !p ? (
            <div className="mt-4 text-sm text-muted-foreground">Não foi possível carregar este perfil.</div>
          ) : (
            <div className="mt-4">
              <div className="flex items-start gap-3">
                {p.avatar_url ? (
                  <img
                    src={p.avatar_url}
                    alt={`Avatar de ${p.display_name}`}
                    className="h-14 w-14 rounded-full object-cover border border-border/70"
                    loading="lazy"
                  />
                ) : (
                  <div className="h-14 w-14 rounded-full border border-border/70 invictus-surface" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-base font-semibold">{p.display_name}</div>
                  <div className="truncate text-sm text-muted-foreground">@{p.username}</div>
                  {p.city && p.state ? (
                    <div className="mt-1 text-sm text-muted-foreground">
                      {p.city}/{p.state}
                    </div>
                  ) : null}
                </div>
              </div>

              <ExpertisesChips items={p.expertises} className="mt-3" />

              {p.bio ? <p className="mt-3 text-sm leading-relaxed text-foreground/90">{p.bio}</p> : null}

              <div className="mt-4 grid gap-2">
                <Button
                  className="h-11"
                  onClick={() => {
                    onOpenChange(false);
                    navigate(`/membro/${p.username}`);
                  }}
                >
                  Ver perfil
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    className="h-11"
                    variant={isFollowing ? "secondary" : "default"}
                    onClick={() => toggleFollow.mutate()}
                    disabled={toggleFollow.isPending}
                  >
                    {toggleFollow.isPending ? "Aguarde…" : isFollowing ? "Seguindo" : "Seguir"}
                  </Button>
                  <Button
                    className="h-11"
                    variant="secondary"
                    onClick={() => createConversation.mutate()}
                    disabled={createConversation.isPending}
                  >
                    {createConversation.isPending ? "Abrindo…" : "Mensagem"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
