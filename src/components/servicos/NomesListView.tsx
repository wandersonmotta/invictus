import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Eye, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";

interface LimpaNomeRequest {
  id: string;
  person_name: string;
  document: string | null;
  status: string;
  whatsapp: string | null;
  created_at: string;
}

interface NomesListViewProps {
  status: string;
  onBack: () => void;
  onViewDetail: (request: LimpaNomeRequest) => void;
}

const statusLabel: Record<string, string> = {
  aberto: "Aberto",
  em_andamento: "Em andamento",
  finalizado: "Finalizado",
};

export function NomesListView({ status, onBack, onViewDetail }: NomesListViewProps) {
  const [search, setSearch] = useState("");

  const { data: requests = [] } = useQuery({
    queryKey: ["limpa-nome-requests", status],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("limpa_nome_requests" as any)
        .select("id, person_name, document, status, whatsapp, created_at")
        .eq("status", status)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as LimpaNomeRequest[];
    },
  });

  const filtered = search.trim()
    ? requests.filter((r) => {
        const q = search.replace(/\D/g, "");
        if (q && r.document) return r.document.replace(/\D/g, "").includes(q);
        const textQ = search.toLowerCase();
        return r.person_name.toLowerCase().includes(textQ);
      })
    : requests;

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-6">
      {/* Header */}
      <button onClick={onBack} className="flex items-center gap-2 text-muted-foreground mb-6">
        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
          <ArrowLeft className="h-4 w-4" />
        </div>
        <span className="text-sm font-medium">Voltar</span>
      </button>

      <h2 className="text-lg font-semibold text-foreground mb-1">
        {statusLabel[status] || status}
      </h2>
      <p className="text-sm text-muted-foreground mb-4">
        Total de nomes: {requests.length}
      </p>

      {/* Search */}
      <div className="flex items-center gap-2 border border-border rounded-lg px-3 py-2 mb-5">
        <Search className="h-4 w-4 text-muted-foreground shrink-0" />
        <input
          className="bg-transparent w-full text-sm text-foreground placeholder:text-muted-foreground outline-none"
          placeholder="Buscar por nome ou CPF/CNPJ"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* List */}
      <Card className="p-4">
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhum nome encontrado
          </p>
        ) : (
          <div className="flex flex-col">
            {filtered.map((item, idx) => (
              <div key={item.id}>
                {idx > 0 && (
                  <div className="border-t border-dashed border-border my-2" />
                )}
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-semibold text-foreground uppercase">
                      {item.person_name}
                    </p>
                    {item.document && (
                      <p className="text-xs text-muted-foreground">{item.document}</p>
                    )}
                  </div>
                  <button
                    onClick={() => onViewDetail(item)}
                    className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
                    aria-label="Ver detalhes"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
