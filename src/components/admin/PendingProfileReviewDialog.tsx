import * as React from "react";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ExpertisesChips } from "@/components/profile/ExpertisesChips";
import { useToast } from "@/hooks/use-toast";
import { rpcUntyped } from "@/lib/rpc";

type ReviewProfile = {
  profile_id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  city: string | null;
  state: string | null;
  region: string | null;
  expertises: string[] | null;
  created_at: string;
  access_status: "pending" | "approved" | "rejected";
};

export function PendingProfileReviewDialog({
  open,
  profileId,
  onOpenChange,
  onApprove,
  onReject,
  busy,
}: {
  open: boolean;
  profileId: string | null;
  onOpenChange: (open: boolean) => void;
  onApprove: (profileId: string) => Promise<void>;
  onReject: (profileId: string) => Promise<void>;
  busy?: boolean;
}) {
  const { toast } = useToast();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["pending_profile_review", profileId],
    enabled: open && !!profileId,
    queryFn: async () => {
      const { data, error } = await rpcUntyped<ReviewProfile[]>("admin_get_pending_profile_for_review", {
        p_profile_id: profileId,
      });
      if (error) throw error;
      return (data ?? [])[0] ?? null;
    },
    staleTime: 5_000,
  });

  React.useEffect(() => {
    if (!open) return;
    if (!profileId) {
      toast({ title: "Perfil inválido", variant: "destructive" });
      onOpenChange(false);
    }
  }, [open, profileId, toast, onOpenChange]);

  const avatarFallback = React.useMemo(() => {
    const name = (data?.display_name ?? "Membro").trim();
    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("")
      .slice(0, 2);
  }, [data?.display_name]);

  const locationLine = [data?.city, data?.state].filter(Boolean).join(" · ");
  const extraLine = [data?.region].filter(Boolean).join(" · ");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Revisar perfil</DialogTitle>
          <DialogDescription>Confira as informações preenchidas antes de aprovar ou recusar.</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-sm text-muted-foreground">Carregando…</div>
        ) : isError ? (
          <div className="space-y-2">
            <div className="text-sm font-medium text-foreground">Não foi possível carregar o perfil</div>
            <div className="text-xs text-muted-foreground">{String((error as any)?.message ?? error)}</div>
          </div>
        ) : !data ? (
          <div className="py-8 text-sm text-muted-foreground">Perfil não encontrado (talvez já tenha sido aprovado).</div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={data.avatar_url ?? undefined} alt={data.display_name ?? "Avatar"} />
                <AvatarFallback>{avatarFallback || "MB"}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="truncate text-base font-medium">{data.display_name ?? "Membro"}</div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  {data.username ? <span>{data.username}</span> : null}
                  {locationLine ? <span>{locationLine}</span> : null}
                  {extraLine ? <span>{extraLine}</span> : null}
                </div>
                <div className="mt-1 break-all text-[11px] text-muted-foreground">user_id: {data.user_id}</div>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="text-sm font-medium">Bio</div>
              <div className="whitespace-pre-wrap text-sm text-muted-foreground">{data.bio?.trim() || "—"}</div>
              <ExpertisesChips items={data.expertises ?? []} className="mt-2" />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="secondary"
            onClick={() => onOpenChange(false)}
            disabled={Boolean(busy)}
          >
            Voltar
          </Button>
          <Button
            variant="destructive"
            onClick={() => (profileId ? onReject(profileId) : Promise.resolve())}
            disabled={!profileId || Boolean(busy) || isLoading}
          >
            Recusar
          </Button>
          <Button
            onClick={() => (profileId ? onApprove(profileId) : Promise.resolve())}
            disabled={!profileId || Boolean(busy) || isLoading}
          >
            Aprovar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
