import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Plus, ChevronDown, ChevronUp, Send, Clock, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AddNomeDialog } from "./AddNomeDialog";
import { cn } from "@/lib/utils";

type StatusFilter = "todos" | "aberto" | "em_andamento" | "finalizado";

interface LimpaNomeRequest {
  id: string;
  person_name: string;
  document: string | null;
  status: string;
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

export function LimpaNomeView({ onBack }: LimpaNomeViewProps) {
  const [activeFilter, setActiveFilter] = useState<StatusFilter>("todos");
  const [addOpen, setAddOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const { data: requests = [] } = useQuery({
    queryKey: ["limpa-nome-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("limpa_nome_requests" as any)
        .select("id, person_name, document, status, created_at")
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

  const filtered =
    activeFilter === "todos"
      ? requests
      : requests.filter((r) => r.status === activeFilter);

  const toggleSection = (section: string) =>
    setExpandedSection((prev) => (prev === section ? null : section));

  const listByStatus = (status: string) =>
    filtered.filter((r) => r.status === status);

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-6">
      {/* Header */}
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
        {/* Aberto */}
        {(activeFilter === "todos" || activeFilter === "aberto") && (
          <StatusCard
            icon={<Send className="h-5 w-5 text-emerald-500" />}
            title="Aberto"
            subtitle="Total enviado"
            count={counts.aberto}
            footerText="Sem encerramento"
            action={
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 rounded-full bg-primary/10 hover:bg-primary/20"
                onClick={() => setAddOpen(true)}
                aria-label="Adicionar nome"
              >
                <Plus className="h-4 w-4 text-primary" />
              </Button>
            }
            expanded={expandedSection === "aberto"}
            onToggle={() => toggleSection("aberto")}
            items={listByStatus("aberto")}
          />
        )}

        {/* Em andamento */}
        {(activeFilter === "todos" || activeFilter === "em_andamento") && (
          <StatusCard
            icon={<Clock className="h-5 w-5 text-amber-500" />}
            title="Em andamento"
            subtitle="Total em andamento"
            count={counts.em_andamento}
            footerText="Sem atualização"
            expanded={expandedSection === "em_andamento"}
            onToggle={() => toggleSection("em_andamento")}
            items={listByStatus("em_andamento")}
          />
        )}

        {/* Finalizado */}
        {(activeFilter === "todos" || activeFilter === "finalizado") && (
          <StatusCard
            icon={<CheckCircle2 className="h-5 w-5 text-violet-500" />}
            title="Finalizado"
            subtitle="Total finalizados"
            count={counts.finalizado}
            footerText="Sem atualização"
            expanded={expandedSection === "finalizado"}
            onToggle={() => toggleSection("finalizado")}
            items={listByStatus("finalizado")}
          />
        )}
      </div>

      <AddNomeDialog open={addOpen} onOpenChange={setAddOpen} />
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
  expanded: boolean;
  onToggle: () => void;
  items: LimpaNomeRequest[];
}

function StatusCard({
  icon,
  title,
  subtitle,
  count,
  footerText,
  action,
  expanded,
  onToggle,
  items,
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
          {items.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onToggle}
              aria-label={expanded ? "Fechar lista" : "Abrir lista"}
            >
              {expanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </div>

      <p className="text-xs text-muted-foreground mt-2">{footerText}</p>

      {expanded && items.length > 0 && (
        <div className="mt-3 border-t pt-3 flex flex-col gap-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2"
            >
              <div>
                <p className="text-sm font-medium text-foreground">{item.person_name}</p>
                {item.document && (
                  <p className="text-xs text-muted-foreground">{item.document}</p>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {new Date(item.created_at).toLocaleDateString("pt-BR")}
              </p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
