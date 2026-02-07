import { Wallet, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WalletBalanceCardProps {
  balance: number;
  canWithdraw: boolean;
  onWithdraw?: () => void;
}

export function WalletBalanceCard({ balance, canWithdraw, onWithdraw }: WalletBalanceCardProps) {
  const formattedBalance = balance.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  return (
    <div className="flex items-stretch gap-3">
      {/* Balance Card */}
      <div className="relative flex-1 rounded-2xl bg-foreground p-5">
        <Wallet className="absolute right-4 top-4 size-6 text-background/40" />
        <div className="space-y-1">
          <p className="text-sm text-background/60">Saldo atual</p>
          <p className="text-3xl font-bold tracking-tight text-background">
            {formattedBalance}
          </p>
        </div>
      </div>

      {/* Withdraw Button */}
      <Button
        className="flex h-auto items-center justify-center gap-2 rounded-2xl bg-red-100 px-5 py-4 text-red-500 hover:bg-red-200 hover:text-red-600 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/50 dark:hover:text-red-300 border border-red-200 dark:border-red-900/30"
        onClick={onWithdraw}
        disabled={!canWithdraw}
      >
        <span className="text-sm font-semibold">Sacar</span>
        <ArrowUpRight className="size-4" />
      </Button>
    </div>
  );
}
