import * as React from "react";
import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/AuthProvider";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type StatusItem = {
  user_id: string;
  status_text: string;
  expires_at: string;
  display_name: string;
  avatar_url: string | null;
};

export function StatusFeed() {
  const { user } = useAuth();
  const [selectedStatus, setSelectedStatus] = React.useState<StatusItem | null>(null);

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

  return (
    <>
      <div className="flex items-center gap-3 overflow-x-auto pb-1">
        {statuses.map((s) => {
          const isMine = s.user_id === user?.id;
          return (
            <button
              key={s.user_id}
              type="button"
              onClick={() => setSelectedStatus(s)}
              className={cn(
                "flex flex-col items-center gap-1 shrink-0 transition-transform hover:scale-105",
                isMine && "relative"
              )}
            >
              <div
                className={cn(
                  "relative rounded-full p-0.5",
                  isMine
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
                {isMine ? "Você" : s.display_name.split(" ")[0]}
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
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
