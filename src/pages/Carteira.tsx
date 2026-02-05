 import { toast } from "sonner";
 
 import { useAuth } from "@/auth/AuthProvider";
 import { useMyProfile } from "@/hooks/useMyProfile";
 import { WalletBalanceCard } from "@/components/carteira/WalletBalanceCard";
 import { TransactionHistory } from "@/components/carteira/TransactionHistory";
 import type { Transaction } from "@/components/carteira/types";
 
 // Mock data for initial implementation
 const mockTransactions: Transaction[] = [
   { id: "1", date: "2025-12-08T16:29:00", description: "Cred Gawa", type: "entrada", status: "aprovado", amount: 30.0 },
   { id: "2", date: "2025-12-08T15:43:00", description: "Cred Gawa", type: "entrada", status: "aprovado", amount: 60.0 },
   { id: "3", date: "2025-12-08T13:56:00", description: "Cred Gawa", type: "entrada", status: "aprovado", amount: 60.0 },
   { id: "4", date: "2025-12-08T08:08:00", description: "Saque PIX", type: "saida", status: "pendente", amount: 100.0 },
   { id: "5", date: "2025-12-06T13:31:00", description: "Comissão Direto", type: "entrada", status: "aprovado", amount: 45.0 },
   { id: "6", date: "2025-12-05T10:15:00", description: "Saque PIX", type: "saida", status: "aprovado", amount: 50.0 },
   { id: "7", date: "2025-12-04T09:22:00", description: "Cred Gawa", type: "entrada", status: "aprovado", amount: 120.0 },
 ];
 
 const mockBalance = 249.9;
 
 export default function Carteira() {
   const { user } = useAuth();
   const { data: profile } = useMyProfile(user?.id);
 
   const displayName =
     profile?.display_name ||
     [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
     "Usuário";
 
   const handleWithdraw = () => {
     toast.info("Saque — Em breve!", {
       description: "A funcionalidade de saque está sendo desenvolvida.",
     });
   };
 
   return (
     <main className="invictus-page mx-auto max-w-md px-4 py-6 sm:px-0">
       {/* Header */}
       <header className="invictus-page-header">
         <p className="text-sm text-muted-foreground">Olá,</p>
         <h1 className="invictus-h1">{displayName}</h1>
       </header>
 
       {/* Balance Card */}
       <WalletBalanceCard balance={mockBalance} onWithdraw={handleWithdraw} />
 
       {/* Transaction History */}
       <TransactionHistory transactions={mockTransactions} />
     </main>
   );
 }