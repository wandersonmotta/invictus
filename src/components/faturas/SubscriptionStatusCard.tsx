import { CheckCircle2, XCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import invictusLogo from "@/assets/INVICTUS-GOLD_1.png";

interface SubscriptionStatusCardProps {
  planName: string | null;
  invoiceStatus: "pending" | "paid" | "overdue" | null;
  dueDate: string | null;
}

export function SubscriptionStatusCard({ planName, invoiceStatus, dueDate }: SubscriptionStatusCardProps) {
  const isPaid = invoiceStatus === "paid";

  if (!planName) {
    return (
      <div className="rounded-2xl bg-card border border-border p-6 text-center space-y-3">
        <img src={invictusLogo} alt="Invictus" className="h-10 mx-auto opacity-60" />
        <p className="text-muted-foreground text-sm">Você ainda não possui um plano ativo.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-card border border-border p-6 space-y-4">
      <img src={invictusLogo} alt="Invictus" className="h-10 mx-auto" />

      <div className="text-center space-y-1">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Seu plano</p>
        <h2 className="text-xl font-bold text-foreground">{planName}</h2>
      </div>

      <div className="flex items-center justify-center gap-2">
        {isPaid ? (
          <>
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            <span className="text-sm font-medium text-emerald-500">Pagamento aprovado</span>
          </>
        ) : (
          <>
            <XCircle className="h-5 w-5 text-destructive" />
            <span className="text-sm font-medium text-destructive">Pendente de pagamento</span>
          </>
        )}
      </div>

      {dueDate && (
        <p className="text-center text-xs text-muted-foreground">
          Vencimento: {format(new Date(dueDate), "dd/MM/yyyy", { locale: ptBR })}
        </p>
      )}
    </div>
  );
}
