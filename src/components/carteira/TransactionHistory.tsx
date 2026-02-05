 import { useState } from "react";
 import { ArrowDownUp, ArrowUpRight, ArrowDownRight, Clock } from "lucide-react";
 import { cn } from "@/lib/utils";
 import { TransactionRow } from "./TransactionRow";
 import type { Transaction, TransactionType, TransactionStatus } from "./types";
 
 type FilterType = "todos" | TransactionType | "pendente";
 
 interface TransactionHistoryProps {
   transactions: Transaction[];
 }
 
 const filters: { id: FilterType; label: string; icon: typeof ArrowUpRight }[] = [
   { id: "todos", label: "Todos", icon: ArrowDownUp },
   { id: "entrada", label: "Entradas", icon: ArrowUpRight },
   { id: "saida", label: "Saídas", icon: ArrowDownRight },
   { id: "pendente", label: "Pendente", icon: Clock },
 ];
 
 export function TransactionHistory({ transactions }: TransactionHistoryProps) {
   const [activeFilter, setActiveFilter] = useState<FilterType>("todos");
 
   const filteredTransactions = transactions.filter((t) => {
     if (activeFilter === "todos") return true;
     if (activeFilter === "pendente") return t.status === "pendente";
     return t.type === activeFilter;
   });
 
   return (
     <section className="space-y-4">
       {/* Header */}
       <div className="flex items-center gap-2 text-foreground">
         <ArrowDownUp className="size-5 text-primary" />
         <h2 className="text-base font-semibold">Histórico de movimentações</h2>
       </div>
 
       {/* Filters */}
       <div className="flex flex-wrap gap-2">
         {filters.map((filter) => {
           const isActive = activeFilter === filter.id;
           return (
             <button
               key={filter.id}
               onClick={() => setActiveFilter(filter.id)}
               className={cn(
                 "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                 isActive
                   ? "bg-primary text-primary-foreground"
                   : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
               )}
             >
               <filter.icon className="size-3.5" />
               {filter.label}
             </button>
           );
         })}
       </div>
 
       {/* Transaction List */}
       <div className="space-y-3">
         {filteredTransactions.length === 0 ? (
           <p className="py-8 text-center text-sm text-muted-foreground">
             Nenhuma movimentação encontrada.
           </p>
         ) : (
           filteredTransactions.map((transaction) => (
             <TransactionRow key={transaction.id} transaction={transaction} />
           ))
         )}
       </div>
     </section>
   );
 }