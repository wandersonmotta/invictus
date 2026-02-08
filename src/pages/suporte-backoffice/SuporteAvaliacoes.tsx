import { useQuery } from "@tanstack/react-query";
import { Star, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface Rating {
  id: string;
  ticket_id: string;
  user_id: string;
  agent_id: string | null;
  rating_resolved: number;
  rating_agent: number;
  created_at: string;
}

function Stars({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={cn("h-3.5 w-3.5", s <= value ? "fill-amber-400 text-amber-400" : "text-muted-foreground/20")}
        />
      ))}
    </div>
  );
}

export default function SuporteAvaliacoes() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: ratings = [], isLoading } = useQuery({
    queryKey: ["suporte-avaliacoes"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("support_ratings")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data || []) as Rating[];
    },
  });

  // Collect unique user/agent IDs
  const allIds = [
    ...new Set(ratings.flatMap((r) => [r.user_id, r.agent_id].filter(Boolean))),
  ] as string[];

  const { data: profiles = {} } = useQuery({
    queryKey: ["suporte-avaliacoes-profiles", allIds.join(",")],
    enabled: allIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", allIds);
      const map: Record<string, { name: string; avatar: string | null }> = {};
      (data || []).forEach((p: any) => {
        map[p.user_id] = { name: p.display_name || "—", avatar: p.avatar_url };
      });
      return map;
    },
  });

  // Fetch AI summaries for tickets
  const ticketIds = [...new Set(ratings.map((r) => r.ticket_id))];
  const { data: summaries = {} } = useQuery({
    queryKey: ["suporte-avaliacoes-summaries", ticketIds.join(",")],
    enabled: ticketIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from("support_tickets")
        .select("id, ai_summary")
        .in("id", ticketIds);
      const map: Record<string, string | null> = {};
      (data || []).forEach((t: any) => {
        map[t.id] = t.ai_summary;
      });
      return map;
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Avaliações</h1>
        <p className="text-sm text-muted-foreground">Feedback dos usuários sobre os atendimentos</p>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground py-8 text-center">Carregando...</div>
      ) : ratings.length === 0 ? (
        <div className="text-sm text-muted-foreground py-8 text-center">Nenhuma avaliação ainda.</div>
      ) : (
        <div className="space-y-3">
          {ratings.map((r) => {
            const userP = profiles[r.user_id];
            const agentP = r.agent_id ? profiles[r.agent_id] : null;
            const summary = summaries[r.ticket_id];
            const expanded = expandedId === r.id;

            return (
              <div key={r.id} className="rounded-xl border border-border bg-card/50 p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-3 text-sm">
                      <span className="font-medium">{userP?.name || "Usuário"}</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="text-muted-foreground">{agentP?.name || "IA"}</span>
                    </div>
                    <div className="flex flex-wrap gap-4">
                      <div className="space-y-0.5">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Solucionado</p>
                        <Stars value={r.rating_resolved} />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Cordialidade</p>
                        <Stars value={r.rating_agent} />
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>

                {/* AI Summary toggle */}
                {summary && (
                  <div>
                    <button
                      onClick={() => setExpandedId(expanded ? null : r.id)}
                      className="flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      Resumo IA
                    </button>
                    {expanded && (
                      <div className="mt-2 rounded-lg bg-muted/30 p-3 text-xs leading-relaxed whitespace-pre-wrap text-muted-foreground">
                        {summary}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
