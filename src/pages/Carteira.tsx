import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

import { useAuth } from "@/auth/AuthProvider";
import { useMyProfile } from "@/hooks/useMyProfile";
import { rpcUntyped } from "@/lib/rpc";
import { WalletBalanceCard } from "@/components/carteira/WalletBalanceCard";
import { TransactionHistory } from "@/components/carteira/TransactionHistory";
import { WithdrawDialog } from "@/components/carteira/WithdrawDialog";
import { Skeleton } from "@/components/ui/skeleton";
import type { Transaction } from "@/components/carteira/types";
import { MIN_WITHDRAW } from "@/components/carteira/types";

interface WalletTx {
  id: string;
  type: "credit" | "debit";
  amount: number;
  description: string;
  source_type: string;
  created_at: string;
}

interface WalletWithdrawal {
  id: string;
  gross_amount: number;
  net_amount: number;
  fee_amount: number;
  status: "pending" | "approved" | "rejected";
  requested_at: string;
  pix_key: string;
  rejection_reason?: string | null;
}

interface WalletData {
  balance: number;
  transactions: WalletTx[];
  pending_withdrawals: WalletWithdrawal[];
}

/** Map backend data → unified Transaction[] for the UI */
function mapToTransactions(data: WalletData): Transaction[] {
  const items: Transaction[] = [];

  for (const tx of data.transactions) {
    items.push({
      id: tx.id,
      date: tx.created_at,
      description: tx.description,
      type: tx.type === "credit" ? "entrada" : "saida",
      status: "aprovado",
      amount: tx.amount,
    });
  }

  // pending_withdrawals contains ALL withdrawal requests (pending, approved, rejected)
  for (const w of data.pending_withdrawals ?? []) {
    if (w.status === "approved") continue; // already has a corresponding debit in transactions
    
    const statusMap: Record<string, "pendente" | "rejeitado"> = {
      pending: "pendente",
      rejected: "rejeitado",
    };

    items.push({
      id: w.id,
      date: w.requested_at,
      description: w.status === "rejected"
        ? (w.rejection_reason ? `Saque recusado – ${w.rejection_reason}` : "Saque recusado")
        : "Saque PIX",
      type: "saida",
      status: statusMap[w.status] ?? "pendente",
      amount: w.net_amount,
      grossAmount: w.gross_amount,
    });
  }

  items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return items;
}

export default function Carteira() {
  const { user } = useAuth();
  const { data: profile } = useMyProfile(user?.id);

  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const displayName =
    profile?.display_name ||
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
    "Usuário";

  const canWithdraw = balance >= MIN_WITHDRAW;

  const fetchWallet = useCallback(async () => {
    const { data, error } = await rpcUntyped<WalletData>("get_my_wallet");
    if (error) {
      console.error("get_my_wallet error:", error);
      toast.error("Erro ao carregar carteira");
      setLoading(false);
      return;
    }
    const walletData = typeof data === "string" ? JSON.parse(data) : data;
    setBalance(walletData.balance ?? 0);
    setTransactions(mapToTransactions(walletData));
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user) fetchWallet();
  }, [user, fetchWallet]);

  const handleWithdrawSubmit = async (grossAmount: number, netAmount: number, pixKey: string) => {
    const { error } = await rpcUntyped("create_withdrawal_request", {
      p_gross_amount: grossAmount,
      p_pix_key: pixKey,
    });

    if (error) {
      toast.error("Erro ao solicitar saque", {
        description: error.message ?? "Tente novamente.",
      });
      throw error; // keeps dialog open
    }

    toast.success("Saque solicitado!", {
      description: `Valor líquido: R$ ${netAmount.toFixed(2).replace(".", ",")}`,
    });

    setWithdrawOpen(false);
    // Reload wallet data — balance already decreased on the backend
    await fetchWallet();
  };

  return (
    <main className="invictus-page mx-auto w-full max-w-md px-4 py-6 pb-24 sm:px-6">
      {/* Header */}
      <header className="invictus-page-header">
        <p className="text-sm text-muted-foreground">Olá,</p>
        <h1 className="invictus-h1">{displayName}</h1>
      </header>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-10 w-24 ml-auto rounded-lg" />
          <Skeleton className="h-8 w-48 rounded-lg" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      ) : (
        <>
          {/* Balance Card */}
          <WalletBalanceCard
            balance={balance}
            canWithdraw={canWithdraw}
            onWithdraw={() => setWithdrawOpen(true)}
          />

          {/* Transaction History */}
          <TransactionHistory transactions={transactions} />
        </>
      )}

      {/* Withdraw Dialog */}
      <WithdrawDialog
        open={withdrawOpen}
        onOpenChange={setWithdrawOpen}
        balance={balance}
        pixKey={profile?.pix_key ?? null}
        onSubmit={handleWithdrawSubmit}
      />
    </main>
  );
}
