import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CreditCard, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/AuthProvider";
import { PendingPaymentCard } from "@/components/pagamentos/PendingPaymentCard";
import { ApprovedPaymentCard } from "@/components/pagamentos/ApprovedPaymentCard";
import { PixPaymentView } from "@/components/servicos/PixPaymentView";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ServicePayment {
  id: string;
  service_type: string;
  status: string;
  amount_cents: number;
  item_count: number;
  items_snapshot: any;
  payment_external_id: string | null;
  pix_qr_code_url: string | null;
  pix_code: string | null;
  expires_at: string | null;
  paid_at: string | null;
  created_at: string;
}

export default function Pagamentos() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activePayment, setActivePayment] = useState<ServicePayment | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("all");
  const { data: payments, isLoading } = useQuery({
    queryKey: ["service_payments", user?.id],
    enabled: !!user?.id,
    refetchInterval: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_payments" as any)
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as ServicePayment[];
    },
  });

  const now = Date.now();
  const pending = (payments || []).filter(
    (p) => p.status === "pending" && p.expires_at && new Date(p.expires_at).getTime() > now
  );
  const approved = (payments || []).filter((p) => p.status === "approved");

  if (activePayment) {
    return (
      <PixPaymentView
        paymentData={{
          payment_intent_id: activePayment.payment_external_id || "",
          pix_qr_code_url: activePayment.pix_qr_code_url || "",
          pix_code: activePayment.pix_code || "",
          expires_at: Math.floor(new Date(activePayment.expires_at!).getTime() / 1000),
        }}
        totalAmount={activePayment.amount_cents / 100}
        onBack={() => setActivePayment(null)}
        onComplete={() => {
          setActivePayment(null);
          queryClient.invalidateQueries({ queryKey: ["service_payments"] });
        }}
        servicePaymentId={activePayment.id}
      />
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <CreditCard className="h-6 w-6 text-primary" />
        <h1 className="text-xl font-bold text-foreground">Pagamentos</h1>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="pending">Pendentes</TabsTrigger>
          <TabsTrigger value="approved">Aprovados</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Pending */}
          {(filter === "all" || filter === "pending") && (
            <section className="mb-8">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Pagamentos Pendentes ({pending.length})
              </h2>
              {pending.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum pagamento pendente.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {pending.map((p) => (
                    <PendingPaymentCard
                      key={p.id}
                      id={p.id}
                      serviceType={p.service_type}
                      itemCount={p.item_count}
                      amountCents={p.amount_cents}
                      expiresAt={p.expires_at!}
                      onPay={() => setActivePayment(p)}
                      onExpired={() => queryClient.invalidateQueries({ queryKey: ["service_payments"] })}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Approved */}
          {(filter === "all" || filter === "approved") && (
            <section>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Pagamentos Aprovados ({approved.length})
              </h2>
              {approved.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum pagamento aprovado.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {approved.map((p) => (
                    <ApprovedPaymentCard
                      key={p.id}
                      serviceType={p.service_type}
                      itemCount={p.item_count}
                      amountCents={p.amount_cents}
                      paidAt={p.paid_at!}
                    />
                  ))}
                </div>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}
