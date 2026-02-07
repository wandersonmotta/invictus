import { useState, useEffect } from "react";
import { Clock, CreditCard, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface PendingPaymentCardProps {
  id: string;
  serviceType: string;
  itemCount: number;
  amountCents: number;
  expiresAt: string;
  onPay: () => void;
  onExpired: () => void;
}

const SERVICE_LABELS: Record<string, string> = {
  limpa_nome: "Limpa Nome",
};

export function PendingPaymentCard({
  serviceType,
  itemCount,
  amountCents,
  expiresAt,
  onPay,
  onExpired,
}: PendingPaymentCardProps) {
  const [secondsLeft, setSecondsLeft] = useState(() => {
    const diff = Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000);
    return Math.max(0, diff);
  });

  useEffect(() => {
    if (secondsLeft <= 0) {
      onExpired();
      return;
    }
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const label = SERVICE_LABELS[serviceType] || serviceType;

  if (secondsLeft <= 0) return null;

  return (
    <Card className="p-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <ShoppingBag className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{label}</p>
          <p className="text-xs text-muted-foreground">
            {itemCount} {itemCount === 1 ? "item" : "itens"} · R$ {(amountCents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
          </p>
          <div className="flex items-center gap-1 mt-0.5">
            <Clock className="h-3 w-3 text-destructive" />
            <span className="text-xs font-mono text-destructive">
              {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </span>
          </div>
        </div>
      </div>
      <Button size="sm" onClick={onPay} className="shrink-0">
        <CreditCard className="h-4 w-4 mr-1" />
        Pagar
      </Button>
    </Card>
  );
}
