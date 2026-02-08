import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle2, Clock, AlertTriangle } from "lucide-react";

interface Invoice {
  id: string;
  amount_cents: number;
  status: "pending" | "paid" | "overdue";
  due_date: string;
  paid_at: string | null;
}

interface InvoiceHistoryListProps {
  invoices: Invoice[];
}

const statusConfig = {
  paid: { label: "Pago", icon: CheckCircle2, color: "text-emerald-500" },
  pending: { label: "Pendente", icon: Clock, color: "text-yellow-500" },
  overdue: { label: "Vencida", icon: AlertTriangle, color: "text-destructive" },
} as const;

export function InvoiceHistoryList({ invoices }: InvoiceHistoryListProps) {
  if (invoices.length === 0) {
    return (
      <p className="text-center text-sm text-muted-foreground py-6">
        Nenhuma fatura encontrada.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {invoices.map((inv) => {
        const cfg = statusConfig[inv.status];
        const Icon = cfg.icon;
        const price = (inv.amount_cents / 100).toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        });

        return (
          <div
            key={inv.id}
            className="flex items-center justify-between rounded-xl bg-card border border-border px-4 py-3"
          >
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-foreground">{price}</p>
              <p className="text-xs text-muted-foreground">
                Vence {format(new Date(inv.due_date), "dd/MM/yyyy", { locale: ptBR })}
              </p>
            </div>
            <div className={`flex items-center gap-1.5 ${cfg.color}`}>
              <Icon className="h-4 w-4" />
              <span className="text-xs font-medium">{cfg.label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
