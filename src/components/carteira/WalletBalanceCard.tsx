 import { CreditCard, ExternalLink } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { cn } from "@/lib/utils";
 
 interface WalletBalanceCardProps {
   balance: number;
   onWithdraw?: () => void;
 }
 
 export function WalletBalanceCard({ balance, onWithdraw }: WalletBalanceCardProps) {
   const formattedBalance = balance.toLocaleString("pt-BR", {
     style: "currency",
     currency: "BRL",
   });
 
   return (
     <div className="flex flex-col items-center gap-4">
       {/* Balance Card */}
       <div
         className={cn(
           "invictus-surface invictus-frame relative w-full rounded-2xl p-5",
           "bg-gradient-to-br from-card/80 to-card/60"
         )}
       >
         {/* Icon */}
         <CreditCard className="absolute right-4 top-4 size-6 text-primary/60" />
 
         {/* Content */}
         <div className="space-y-1">
           <p className="text-sm text-muted-foreground">Bônus atual</p>
           <p className="text-3xl font-bold tracking-tight text-foreground">
             {formattedBalance}
           </p>
         </div>
       </div>
 
       {/* Withdraw Button */}
       <Button
         variant="goldOutline"
         className="gap-2"
         onClick={onWithdraw}
       >
         Sacar
         <ExternalLink className="size-4" />
       </Button>
     </div>
   );
 }