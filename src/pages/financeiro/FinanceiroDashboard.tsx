 import { useEffect, useState } from "react";
 import { useNavigate } from "react-router-dom";
 import { rpcUntyped } from "@/lib/rpc";
 import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
 import { Badge } from "@/components/ui/badge";
 import { Button } from "@/components/ui/button";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Skeleton } from "@/components/ui/skeleton";
 import { RefreshCw, Eye } from "lucide-react";
 import { format } from "date-fns";
 import { ptBR } from "date-fns/locale";
 
 interface PendingWithdrawal {
   withdrawal_id: string;
   user_id: string;
   display_name: string | null;
   username: string | null;
   avatar_url: string | null;
   gross_amount: number;
   fee_amount: number;
   net_amount: number;
   pix_key: string;
   requested_at: string;
   current_balance: number;
 }
 
 export default function FinanceiroDashboard() {
   const navigate = useNavigate();
   const [withdrawals, setWithdrawals] = useState<PendingWithdrawal[]>([]);
   const [loading, setLoading] = useState(true);

  // Detect if we're on preview (lovable) or production
  const isPreview = window.location.hostname.endsWith(".lovable.app") || window.location.hostname.endsWith(".lovableproject.com");
  const auditPath = isPreview ? "/financeiro/auditoria" : "/auditoria";
 
   const fetchQueue = async () => {
     setLoading(true);
     const { data, error } = await rpcUntyped<PendingWithdrawal[]>(
       "list_pending_withdrawals",
       { p_limit: 100 }
     );
     if (!error && data) {
       setWithdrawals(data);
     }
     setLoading(false);
   };
 
   useEffect(() => {
     fetchQueue();
   }, []);
 
   const formatCurrency = (value: number) =>
     new Intl.NumberFormat("pt-BR", {
       style: "currency",
       currency: "BRL",
     }).format(value);
 
   return (
     <div className="space-y-6">
       <div className="flex items-center justify-between">
         <div>
           <h1 className="text-2xl font-bold">Fila de Auditoria</h1>
           <p className="text-sm text-muted-foreground">
             {withdrawals.length} solicitação(ões) pendente(s)
           </p>
         </div>
         <Button variant="outline" size="sm" onClick={fetchQueue} disabled={loading}>
           <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
           Atualizar
         </Button>
       </div>
 
       {loading ? (
         <div className="space-y-3">
           {[1, 2, 3].map((i) => (
             <Skeleton key={i} className="h-24 w-full" />
           ))}
         </div>
       ) : withdrawals.length === 0 ? (
         <Card>
           <CardContent className="flex h-40 items-center justify-center">
             <p className="text-muted-foreground">Nenhuma solicitação pendente</p>
           </CardContent>
         </Card>
       ) : (
         <div className="space-y-3">
           {withdrawals.map((w) => (
             <Card
               key={w.withdrawal_id}
               className="cursor-pointer transition-colors hover:bg-accent/50"
              onClick={() => navigate(`${auditPath}/${w.withdrawal_id}`)}
             >
               <CardContent className="flex items-center gap-4 p-4">
                 <Avatar className="h-12 w-12">
                   <AvatarImage src={w.avatar_url || undefined} />
                   <AvatarFallback>
                     {(w.display_name || w.username || "?").charAt(0).toUpperCase()}
                   </AvatarFallback>
                 </Avatar>
 
                 <div className="flex-1">
                   <div className="flex items-center gap-2">
                     <span className="font-medium">
                       {w.display_name || w.username || "Membro"}
                     </span>
                     {w.username && (
                       <span className="text-sm text-muted-foreground">
                         {w.username.startsWith("@") ? w.username : `@${w.username}`}
                       </span>
                     )}
                   </div>
                   <div className="mt-1 flex flex-wrap gap-2 text-sm text-muted-foreground">
                     <span>PIX: {w.pix_key}</span>
                     <span>•</span>
                     <span>
                       {format(new Date(w.requested_at), "dd/MM/yyyy HH:mm", {
                         locale: ptBR,
                       })}
                     </span>
                   </div>
                 </div>
 
                 <div className="text-right">
                   <div className="text-lg font-semibold text-[hsl(var(--gold))]">
                     {formatCurrency(w.net_amount)}
                   </div>
                   <div className="text-xs text-muted-foreground">
                     Bruto: {formatCurrency(w.gross_amount)}
                   </div>
                 </div>
 
                 <Badge variant="outline" className="ml-2">
                   Pendente
                 </Badge>
 
                 <Button variant="ghost" size="icon">
                   <Eye className="h-4 w-4" />
                 </Button>
               </CardContent>
             </Card>
           ))}
         </div>
       )}
     </div>
   );
 }