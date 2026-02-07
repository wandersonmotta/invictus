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
        className="flex h-auto flex-col items-center justify-center gap-1 rounded-2xl bg-red-950/40 px-5 text-red-400 hover:bg-red-950/60 hover:text-red-300 border border-red-900/30"
        onClick={onWithdraw}
        disabled={!canWithdraw}
      >
        <ArrowUpRight className="size-5" />
        <span className="text-xs font-semibold">Sacar</span>
      </Button>
    </div>
  );
}
