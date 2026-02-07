import { CheckCircle2, ShoppingBag } from "lucide-react";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ApprovedPaymentCardProps {
  serviceType: string;
  itemCount: number;
  amountCents: number;
  paidAt: string;
}

const SERVICE_LABELS: Record<string, string> = {
  limpa_nome: "Limpa Nome",
};

export function ApprovedPaymentCard({
  serviceType,
  itemCount,
  amountCents,
  paidAt,
}: ApprovedPaymentCardProps) {
  const label = SERVICE_LABELS[serviceType] || serviceType;

  return (
    <Card className="p-4 flex items-center gap-3">
      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
        <CheckCircle2 className="h-5 w-5 text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground truncate">{label}</p>
        <p className="text-xs text-muted-foreground">
          {itemCount} {itemCount === 1 ? "item" : "itens"} · R$ {(amountCents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-xs text-muted-foreground">
          {format(new Date(paidAt), "dd/MM/yyyy", { locale: ptBR })}
        </p>
        <p className="text-xs text-muted-foreground">
          {format(new Date(paidAt), "HH:mm")}
        </p>
      </div>
    </Card>
  );
}
