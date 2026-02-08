import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { SubscriptionStatusCard } from "@/components/faturas/SubscriptionStatusCard";
import { PlanCard } from "@/components/faturas/PlanCard";
import { InvoiceHistoryList } from "@/components/faturas/InvoiceHistoryList";

export default function Faturas() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Fetch all plans + features
  const { data: plans, isLoading: plansLoading } = useQuery({
    queryKey: ["subscription-plans"],
    queryFn: async () => {
      const { data: plansData } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("active", true)
        .order("sort_order");

      const { data: featuresData } = await supabase
        .from("plan_features")
        .select("*")
        .order("sort_order");

      return (plansData ?? []).map((p: any) => ({
        ...p,
        features: (featuresData ?? []).filter((f: any) => f.plan_id === p.id),
      }));
    },
  });

  // Fetch user's active subscription
  const { data: subscription, isLoading: subLoading } = useQuery({
    queryKey: ["my-subscription", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("member_subscriptions")
        .select("*, subscription_plans(*)")
        .eq("user_id", user!.id)
        .in("status", ["active", "past_due"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  // Fetch user's invoices
  const { data: invoices, isLoading: invoicesLoading } = useQuery({
    queryKey: ["my-invoices", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("subscription_invoices")
        .select("*")
        .eq("user_id", user!.id)
        .order("due_date", { ascending: false })
        .limit(20);
      return data ?? [];
    },
  });

  const isLoading = plansLoading || subLoading || invoicesLoading;

  // While no payment platform is configured, default everyone to the first plan as active
  const defaultPlan = plans?.[0] ?? null;
  const currentPlanId = subscription?.plan_id ?? defaultPlan?.id ?? null;
  const activePlanName = subscription
    ? (subscription as any).subscription_plans?.name ?? "Plano"
    : defaultPlan?.name ?? null;
  const latestInvoice = invoices?.[0] ?? null;

  return (
    <div className="min-h-screen w-full flex flex-col items-center px-4 pt-6 pb-24">
      <div className="w-full max-w-3xl space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/app")}
            className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors"
            aria-label="Voltar"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <h1 className="text-xl font-bold text-foreground">Minhas Faturas</h1>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-40 w-full rounded-2xl" />
            <Skeleton className="h-64 w-full rounded-2xl" />
            <Skeleton className="h-32 w-full rounded-2xl" />
          </div>
        ) : (
          <>
            {/* Subscription Status */}
            <SubscriptionStatusCard
              planName={activePlanName}
              invoiceStatus={latestInvoice?.status as any ?? (activePlanName ? "paid" : null)}
              dueDate={latestInvoice?.due_date ?? null}
            />

            {/* Plans Catalog */}
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Planos Disponíveis</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {(plans ?? []).map((plan: any) => (
                  <PlanCard
                    key={plan.id}
                    name={plan.name}
                    priceCents={plan.price_cents}
                    features={plan.features}
                    isCurrent={plan.id === currentPlanId}
                  />
                ))}
              </div>
            </section>

            {/* Invoice History */}
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Histórico de Faturas</h2>
              <InvoiceHistoryList invoices={invoices ?? []} />
            </section>
          </>
        )}
      </div>
    </div>
  );
}
