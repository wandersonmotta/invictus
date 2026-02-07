import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Plus, Send, Clock, CheckCircle2, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AddNomeView } from "./AddNomeView";
import { NomesListView } from "./NomesListView";
import { NomeDetailView } from "./NomeDetailView";
import { cn } from "@/lib/utils";

type StatusFilter = "todos" | "aberto" | "em_andamento" | "finalizado";

interface LimpaNomeRequest {
  id: string;
  person_name: string;
  document: string | null;
  status: string;
  whatsapp: string | null;
  created_at: string;
}

interface LimpaNomeViewProps {
  onBack: () => void;
}

const filters: { key: StatusFilter; label: string }[] = [
  { key: "todos", label: "Todos" },
  { key: "aberto", label: "Aberto" },
  { key: "em_andamento", label: "Em andamento" },
  { key: "finalizado", label: "Finalizado" },
];

type ViewMode =
  | { type: "dashboard" }
  | { type: "add" }
  | { type: "list"; status: string }
  | { type: "detail"; request: LimpaNomeRequest };

export function LimpaNomeView({ onBack }: LimpaNomeViewProps) {
  const [activeFilter, setActiveFilter] = useState<StatusFilter>("todos");
  const [viewMode, setViewMode] = useState<ViewMode>({ type: "dashboard" });

  const { data: requests = [] } = useQuery({
    queryKey: ["limpa-nome-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("limpa_nome_requests" as any)
        .select("id, person_name, document, status, whatsapp, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as LimpaNomeRequest[];
    },
  });

  const counts = {
    aberto: requests.filter((r) => r.status === "aberto").length,
    em_andamento: requests.filter((r) => r.status === "em_andamento").length,
    finalizado: requests.filter((r) => r.status === "finalizado").length,
  };

  if (viewMode.type === "add") {
    return <AddNomeView onBack={() => setViewMode({ type: "dashboard" })} />;
  }

  if (viewMode.type === "list") {
    return (
      <NomesListView
        status={viewMode.status}
        onBack={() => setViewMode({ type: "dashboard" })}
        onViewDetail={(req) => setViewMode({ type: "detail", request: req })}
      />
    );
  }

  if (viewMode.type === "detail") {
    return (
      <NomeDetailView
        request={viewMode.request}
        onBack={() => setViewMode({ type: "list", status: viewMode.request.status })}
      />
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center gap-2 mb-5">
        <Button variant="ghost" size="icon" onClick={onBack} aria-label="Voltar">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold text-foreground">Limpa Nome</h1>
      </div>

      {/* Filter chips */}
      <div className="grid grid-cols-4 gap-1 mb-6">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setActiveFilter(f.key)}
            className={cn(
              "py-1.5 rounded-full text-[10px] sm:text-sm font-medium transition-colors border text-center leading-tight",
              activeFilter === f.key
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:border-primary/40"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Status cards */}
      <div className="flex flex-col gap-4">
        {(activeFilter === "todos" || activeFilter === "aberto") && (
          <StatusCard
            icon={<Send className="h-5 w-5 text-emerald-500" />}
            title="Aberto"
            subtitle="Total enviado"
            count={counts.aberto}
            footerText="Sem encerramento"
            onViewList={() => setViewMode({ type: "list", status: "aberto" })}
            action={
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 rounded-full bg-primary/10 hover:bg-primary/20"
                onClick={() => setViewMode({ type: "add" })}
                aria-label="Adicionar nome"
              >
                <Plus className="h-4 w-4 text-primary" />
              </Button>
            }
          />
        )}

        {(activeFilter === "todos" || activeFilter === "em_andamento") && (
          <StatusCard
            icon={<Clock className="h-5 w-5 text-amber-500" />}
            title="Em andamento"
            subtitle="Total em andamento"
            count={counts.em_andamento}
            footerText="Sem atualização"
            onViewList={() => setViewMode({ type: "list", status: "em_andamento" })}
          />
        )}

        {(activeFilter === "todos" || activeFilter === "finalizado") && (
          <StatusCard
            icon={<CheckCircle2 className="h-5 w-5 text-violet-500" />}
            title="Finalizado"
            subtitle="Total finalizados"
            count={counts.finalizado}
            footerText="Sem atualização"
            onViewList={() => setViewMode({ type: "list", status: "finalizado" })}
          />
        )}
      </div>
    </div>
  );
}

/* ── internal card ── */

interface StatusCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  count: number;
  footerText: string;
  action?: React.ReactNode;
  onViewList: () => void;
}

function StatusCard({
  icon,
  title,
  subtitle,
  count,
  footerText,
  action,
  onViewList,
}: StatusCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            {icon}
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
            <p className="text-2xl font-bold text-foreground">{count}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {action}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onViewList}
            aria-label={`Ver ${title}`}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-2">{footerText}</p>
    </Card>
  );
}
