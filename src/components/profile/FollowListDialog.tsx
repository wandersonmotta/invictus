 import * as React from "react";
 import { useNavigate } from "react-router-dom";
 import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
 import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
 import { Input } from "@/components/ui/input";
 import { Button } from "@/components/ui/button";
 import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
 import { Skeleton } from "@/components/ui/skeleton";
 import { ScrollArea } from "@/components/ui/scroll-area";
 import { Search, User } from "lucide-react";
 import { rpcUntyped } from "@/lib/rpc";
 import { supabase } from "@/integrations/supabase/client";
 import { toast } from "sonner";
 
 interface FollowUser {
   user_id: string;
   display_name: string;
   username: string | null;
   avatar_url: string | null;
   is_following: boolean;
 }
 
 interface FollowListDialogProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   userId: string;
   mode: "followers" | "following";
   isMyProfile: boolean;
   onFollowChange?: () => void;
 }
 
 export function FollowListDialog({
   open,
   onOpenChange,
   userId,
   mode,
   isMyProfile,
   onFollowChange,
 }: FollowListDialogProps) {
   const navigate = useNavigate();
   const qc = useQueryClient();
   const [search, setSearch] = React.useState("");
   const [debouncedSearch, setDebouncedSearch] = React.useState("");
 
   // Debounce search
   React.useEffect(() => {
     const timer = setTimeout(() => setDebouncedSearch(search), 300);
     return () => clearTimeout(timer);
   }, [search]);
 
   // Reset search when dialog opens/closes
   React.useEffect(() => {
     if (!open) {
       setSearch("");
       setDebouncedSearch("");
     }
   }, [open]);
 
   const listQuery = useQuery({
     queryKey: ["follow_list", mode, userId, debouncedSearch],
     enabled: open && !!userId,
     queryFn: async () => {
       const fnName = mode === "followers" ? "list_followers" : "list_following";
       const { data, error } = await rpcUntyped<FollowUser[]>(fnName, {
         p_user_id: userId,
         p_search: debouncedSearch,
         p_limit: 50,
       });
       if (error) throw error;
       return data ?? [];
     },
     staleTime: 10_000,
   });
 
   const toggleFollowMutation = useMutation({
     mutationFn: async (targetUserId: string) => {
       const { error } = await supabase.rpc("toggle_follow", {
         p_target_user_id: targetUserId,
       });
       if (error) throw error;
     },
     onSuccess: () => {
       qc.invalidateQueries({ queryKey: ["follow_list"] });
       qc.invalidateQueries({ queryKey: ["follow_stats"] });
       onFollowChange?.();
     },
   });
 
   const removeFollowerMutation = useMutation({
     mutationFn: async (followerId: string) => {
       const { data, error } = await rpcUntyped<boolean>("remove_follower", {
         p_follower_id: followerId,
       });
       if (error) throw error;
       return data;
     },
     onSuccess: () => {
       toast.success("Seguidor removido");
       qc.invalidateQueries({ queryKey: ["follow_list"] });
       qc.invalidateQueries({ queryKey: ["follow_stats"] });
       onFollowChange?.();
     },
     onError: () => {
       toast.error("Não foi possível remover");
     },
   });
 
   const handleUserClick = (user: FollowUser) => {
     onOpenChange(false);
     const handle = user.username ? user.username.replace(/^@/, "") : user.user_id;
     navigate(`/membro/${handle}`);
   };
 
   const title = mode === "followers" ? "Seguidores" : "Seguindo";
   const emptyMessage =
     mode === "followers"
       ? debouncedSearch
         ? `Nenhum resultado para "${debouncedSearch}"`
         : "Nenhum seguidor"
       : debouncedSearch
       ? `Nenhum resultado para "${debouncedSearch}"`
       : "Não segue ninguém";
 
   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent className="max-w-md p-0 gap-0 invictus-surface invictus-frame border-border/70">
         <DialogHeader className="p-4 pb-0 text-center">
           <DialogTitle className="text-base font-semibold">{title}</DialogTitle>
         </DialogHeader>
 
         <div className="p-4 pb-2">
           <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
             <Input
               placeholder="Pesquisar"
               value={search}
               onChange={(e) => setSearch(e.target.value)}
               className="pl-9"
             />
           </div>
         </div>
 
         <ScrollArea className="h-[400px] px-4 pb-4">
           {listQuery.isLoading ? (
             <div className="space-y-3">
               {[1, 2, 3, 4, 5].map((i) => (
                 <div key={i} className="flex items-center gap-3">
                   <Skeleton className="h-11 w-11 rounded-full" />
                   <div className="flex-1 space-y-1.5">
                     <Skeleton className="h-3.5 w-24" />
                     <Skeleton className="h-3 w-32" />
                   </div>
                   <Skeleton className="h-8 w-20" />
                 </div>
               ))}
             </div>
           ) : listQuery.isError ? (
             <div className="text-sm text-muted-foreground py-8 text-center">
               Não foi possível carregar
             </div>
           ) : listQuery.data?.length === 0 ? (
             <div className="text-sm text-muted-foreground py-8 text-center">
               {emptyMessage}
             </div>
           ) : (
             <div className="space-y-1">
               {listQuery.data?.map((user) => (
                 <div
                   key={user.user_id}
                   className="flex items-center gap-3 py-2 px-1 rounded-md hover:bg-muted/50 transition-colors"
                 >
                   <button
                     type="button"
                     className="flex items-center gap-3 flex-1 min-w-0 text-left"
                     onClick={() => handleUserClick(user)}
                   >
                     <Avatar className="h-11 w-11 border border-border/50">
                       {user.avatar_url ? (
                         <AvatarImage src={user.avatar_url} alt={user.display_name} />
                       ) : null}
                       <AvatarFallback>
                         <User className="h-5 w-5" />
                       </AvatarFallback>
                     </Avatar>
                     <div className="min-w-0 flex-1">
                       <div className="text-sm font-medium truncate">
                         {user.username ?? user.display_name}
                       </div>
                       <div className="text-xs text-muted-foreground truncate">
                         {user.display_name}
                       </div>
                     </div>
                   </button>
 
                   {/* Action button */}
                   {mode === "followers" && isMyProfile ? (
                     <Button
                       variant="secondary"
                       size="sm"
                       className="shrink-0"
                       disabled={removeFollowerMutation.isPending}
                       onClick={() => removeFollowerMutation.mutate(user.user_id)}
                     >
                       Remover
                     </Button>
                   ) : (
                     <Button
                       variant={user.is_following ? "secondary" : "default"}
                       size="sm"
                       className="shrink-0"
                       disabled={toggleFollowMutation.isPending}
                       onClick={() => toggleFollowMutation.mutate(user.user_id)}
                     >
                       {user.is_following ? "Seguindo" : "Seguir"}
                     </Button>
                   )}
                 </div>
               ))}
             </div>
           )}
         </ScrollArea>
       </DialogContent>
     </Dialog>
   );
 }