import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/AuthProvider";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useToast } from "@/hooks/use-toast";

type StatusItem = {
  user_id: string;
  status_text: string;
  expires_at: string;
  display_name: string;
  avatar_url: string | null;
};

export function StatusFeed() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [selectedStatus, setSelectedStatus] = React.useState<StatusItem | null>(null);
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  const statusQuery = useQuery({
    queryKey: ["mutual_statuses"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_mutual_statuses");
      if (error) throw error;
      return (data ?? []) as StatusItem[];
    },
    staleTime: 30_000,
    enabled: !!user?.id,
  });

  const statuses = statusQuery.data ?? [];

  const handleDelete = async () => {
    if (!user?.id) return;
    setDeleting(true);
    const { error } = await supabase
      .from("member_status")
      .delete()
      .eq("user_id", user.id);
    setDeleting(false);

    if (error) {
      toast({ title: "Erro ao excluir", description: error.message });
      return;
    }

    toast({ title: "Status excluído" });
    setConfirmDelete(false);
    setSelectedStatus(null);
    qc.invalidateQueries({ queryKey: ["mutual_statuses"] });
  };

  if (!statuses.length) {
    return null;
  }

  const formatExpiry = (expiresAt: string) => {
    try {
      const diff = new Date(expiresAt).getTime() - Date.now();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      if (hours > 0) return `${hours}h restantes`;
      const mins = Math.floor(diff / (1000 * 60));
      return `${mins}min restantes`;
    } catch {
      return "";
    }
  };

  const isMine = selectedStatus?.user_id === user?.id;

  return (
    <>
      <div className="flex items-center gap-3 overflow-x-auto pb-1">
        {statuses.map((s) => {
          const isOwn = s.user_id === user?.id;
          return (
            <button
              key={s.user_id}
              type="button"
              onClick={() => setSelectedStatus(s)}
              className={cn(
                "flex flex-col items-center gap-1 shrink-0 transition-transform hover:scale-105",
                isOwn && "relative"
              )}
            >
              <div
                className={cn(
                  "relative rounded-full p-0.5",
                  isOwn
                    ? "bg-gradient-to-br from-primary to-primary/60"
                    : "bg-gradient-to-br from-muted-foreground/40 to-muted-foreground/20"
                )}
              >
                <Avatar className="h-12 w-12 border-2 border-background">
                  <AvatarImage src={s.avatar_url ?? undefined} alt={s.display_name} />
                  <AvatarFallback className="text-xs">
                    {s.display_name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
              <span className="text-[10px] text-muted-foreground max-w-[56px] truncate text-center">
                {isOwn ? "Você" : s.display_name.split(" ")[0]}
              </span>
            </button>
          );
        })}
      </div>

      <Dialog open={!!selectedStatus} onOpenChange={() => setSelectedStatus(null)}>
        <DialogContent className="border-0 bg-transparent p-0 shadow-none max-w-sm">
          <div className="invictus-modal-glass invictus-frame p-5">
            <DialogHeader className="mb-4">
              <DialogTitle className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedStatus?.avatar_url ?? undefined} />
                  <AvatarFallback>
                    {selectedStatus?.display_name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-base font-medium">{selectedStatus?.display_name}</div>
                  <div className="text-xs text-muted-foreground font-normal">
                    {selectedStatus && formatExpiry(selectedStatus.expires_at)}
                  </div>
                </div>
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm">{selectedStatus?.status_text}</p>

            {isMine && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-4 w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir status
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent className="invictus-modal-glass invictus-frame border-0">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir status?</AlertDialogTitle>
            <AlertDialogDescription>
              Seu status será removido imediatamente e não poderá ser recuperado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Excluindo…" : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
