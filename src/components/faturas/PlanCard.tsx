import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import planInicialIcon from "@/assets/plan-inicial-icon.png";

interface PlanFeature {
  id: string;
  label: string;
  included: boolean;
  sort_order: number;
}

interface PlanCardProps {
  name: string;
  priceCents: number;
  features: PlanFeature[];
  isCurrent: boolean;
}

export function PlanCard({ name, priceCents, features, isCurrent }: PlanCardProps) {
  const priceFormatted = (priceCents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  return (
    <div className="rounded-2xl bg-card border border-border p-6 space-y-5 flex flex-col">
      {/* Icon */}
      <div className="mx-auto">
        <img src={planInicialIcon} alt={name} className="h-16 w-16 rounded-xl object-contain" />
      </div>

      {/* Name & Price */}
      <div className="text-center space-y-1">
        <h3 className="text-lg font-bold text-foreground">{name}</h3>
        <p className="text-2xl font-extrabold text-primary">{priceFormatted}<span className="text-sm font-normal text-muted-foreground">/mês</span></p>
      </div>

      {/* Features */}
      <ul className="space-y-3 flex-1">
        {features
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((f) => (
            <li key={f.id} className="flex items-start gap-2.5">
              {f.included ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500 mt-0.5" />
              ) : (
                <XCircle className="h-5 w-5 shrink-0 text-destructive mt-0.5" />
              )}
              <span className={`text-sm leading-snug ${f.included ? "text-foreground" : "text-muted-foreground line-through"}`}>
                {f.label}
              </span>
            </li>
          ))}
      </ul>

      {/* CTA */}
      <Button
        className="w-full"
        variant={isCurrent ? "secondary" : "default"}
        disabled={isCurrent}
      >
        {isCurrent ? "Plano Atual" : "Assinar"}
      </Button>
    </div>
  );
}
