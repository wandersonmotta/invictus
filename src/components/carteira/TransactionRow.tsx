 import { format } from "date-fns";
 import { ptBR } from "date-fns/locale";
 import { cn } from "@/lib/utils";
 import type { Transaction } from "./types";
 
 interface TransactionRowProps {
   transaction: Transaction;
 }
 
 export function TransactionRow({ transaction }: TransactionRowProps) {
   const { date, description, type, status, amount } = transaction;
 
   const formattedDate = format(new Date(date), "dd/MM/yyyy 'às' HH:mm", {
     locale: ptBR,
   });
 
   const formattedAmount = amount.toLocaleString("pt-BR", {
     style: "currency",
     currency: "BRL",
   });
 
   const statusStyles = {
     aprovado: "text-green-500",
     pendente: "text-amber-500",
     rejeitado: "text-red-500",
   };
 
   const amountStyles = {
     entrada: "text-green-500",
     saida: "text-red-500",
   };
 
   return (
     <div className="invictus-surface rounded-xl p-4">
       <div className="flex items-start justify-between gap-3">
         {/* Left: Date + Description */}
         <div className="min-w-0 flex-1 space-y-0.5">
           <p className="text-xs text-muted-foreground">{formattedDate}</p>
           <p className="truncate text-sm font-medium text-foreground">
             {description}
           </p>
         </div>
 
         {/* Right: Status + Amount */}
         <div className="flex flex-col items-end gap-0.5">
           <span className={cn("text-xs font-medium", statusStyles[status])}>
             {status}
           </span>
           <span className={cn("text-sm font-semibold", amountStyles[type])}>
             {type === "saida" ? "-" : "+"} {formattedAmount}
           </span>
         </div>
       </div>
     </div>
   );
 }