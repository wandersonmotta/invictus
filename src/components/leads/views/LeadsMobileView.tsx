import { Card } from "@/components/ui/card";
import { Smartphone } from "lucide-react";

export function LeadsMobileView() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <Card className="p-8 bg-card/60 backdrop-blur-sm border-border/40 text-center max-w-md">
        <Smartphone className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h2 className="text-lg font-semibold text-foreground mb-2">
          Visualização Mobile
        </h2>
        <p className="text-sm text-muted-foreground">
          A view mobile está em desenvolvimento. Em breve você poderá visualizar
          métricas otimizadas para dispositivos móveis.
        </p>
      </Card>
    </div>
  );
}
