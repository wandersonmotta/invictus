 import { useState } from "react";
 import { toast } from "sonner";
 
 import { useAuth } from "@/auth/AuthProvider";
 import { useMyProfile } from "@/hooks/useMyProfile";
 import { WalletBalanceCard } from "@/components/carteira/WalletBalanceCard";
 import { TransactionHistory } from "@/components/carteira/TransactionHistory";
 import { WithdrawDialog } from "@/components/carteira/WithdrawDialog";
import type { Transaction } from "@/components/carteira/types";
import { MIN_WITHDRAW } from "@/components/carteira/types";
 
 // Mock data for initial implementation (saídas mostram valor LÍQUIDO)
const initialMockTransactions: Transaction[] = [
   { id: "1", date: "2025-12-08T16:29:00", description: "Cred Gawa", type: "entrada", status: "aprovado", amount: 30.0 },
   { id: "2", date: "2025-12-08T15:43:00", description: "Cred Gawa", type: "entrada", status: "aprovado", amount: 60.0 },
   { id: "3", date: "2025-12-08T13:56:00", description: "Cred Gawa", type: "entrada", status: "aprovado", amount: 60.0 },
   { id: "4", date: "2025-12-08T08:08:00", description: "Saque PIX", type: "saida", status: "pendente", amount: 95.01, grossAmount: 100 },
   { id: "5", date: "2025-12-06T13:31:00", description: "Comissão Direto", type: "entrada", status: "aprovado", amount: 45.0 },
   { id: "6", date: "2025-12-05T10:15:00", description: "Saque PIX", type: "saida", status: "aprovado", amount: 47.51, grossAmount: 50 },
   { id: "7", date: "2025-12-04T09:22:00", description: "Cred Gawa", type: "entrada", status: "aprovado", amount: 120.0 },
 ];
 
 const mockBalance = 249.9;
 
 export default function Carteira() {
   const { user } = useAuth();
   const { data: profile } = useMyProfile(user?.id);
   const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>(initialMockTransactions);
 
   const displayName =
     profile?.display_name ||
     [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
     "Usuário";
 
  const canWithdraw = mockBalance >= MIN_WITHDRAW;

   const handleWithdrawSubmit = (grossAmount: number, netAmount: number, pixKey: string) => {
    // Criar nova transação pendente
    const newTransaction: Transaction = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      description: "Saque PIX",
      type: "saida",
      status: "pendente",
      amount: netAmount,
      grossAmount: grossAmount,
    };

    // Adicionar ao topo da lista
    setTransactions((prev) => [newTransaction, ...prev]);

     toast.success("Saque solicitado!", {
      description: `Valor líquido: R$ ${netAmount.toFixed(2).replace(".", ",")}`,
     });

     setWithdrawOpen(false);
   };
 
   return (
      <main className="invictus-page mx-auto w-full max-w-md px-4 py-6 pb-24 sm:px-6">
       {/* Header */}
       <header className="invictus-page-header">
         <p className="text-sm text-muted-foreground">Olá,</p>
         <h1 className="invictus-h1">{displayName}</h1>
       </header>
 
       {/* Balance Card */}
      <WalletBalanceCard 
        balance={mockBalance} 
        canWithdraw={canWithdraw}
        onWithdraw={() => setWithdrawOpen(true)} 
      />
 
       {/* Transaction History */}
      <TransactionHistory transactions={transactions} />
       
       {/* Withdraw Dialog */}
       <WithdrawDialog
         open={withdrawOpen}
         onOpenChange={setWithdrawOpen}
         balance={mockBalance}
         pixKey={profile?.pix_key ?? null}
         onSubmit={handleWithdrawSubmit}
       />
     </main>
   );
 }