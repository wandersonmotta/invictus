import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { rpcUntyped } from "@/lib/rpc";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { User } from "lucide-react";

type SearchResult = {
  user_id: string;
  display_name: string;
  username: string | null;
  avatar_url: string | null;
};

export default function Buscar() {
  const [input, setInput] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const navigate = useNavigate();

  // Debounce: atualiza após 300ms de pausa na digitação
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(input.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [input]);

  const searchQuery = useQuery({
    queryKey: ["search_members", debouncedSearch],
    enabled: debouncedSearch.length >= 2,
    queryFn: async () => {
      const { data, error } = await rpcUntyped<SearchResult[]>("search_members", {
        p_search: debouncedSearch,
        p_limit: 30,
      });
      if (error) throw error;
      return (data ?? []) as SearchResult[];
    },
    staleTime: 10_000,
  });

  const results = searchQuery.data ?? [];

  function handleNavigate(username: string | null) {
    if (!username) return;
    navigate(`/membro/${encodeURIComponent(username.replace(/^@/, ""))}`);
  }

  return (
    <main className="invictus-page">
      <header className="invictus-page-header">
        <h1 className="invictus-h1">Buscar</h1>
        <p className="invictus-lead">Encontre membros pelo nome ou @.</p>
      </header>

      <Card className="invictus-surface invictus-frame border-border/70">
        <CardHeader>
          <CardTitle>Buscar membros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Digite um nome ou @username..."
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className="h-11"
          />

          {/* Estado inicial */}
          {debouncedSearch.length < 2 && (
            <p className="text-sm text-muted-foreground">
              Digite pelo menos 2 caracteres para buscar.
            </p>
          )}

          {/* Buscando */}
          {debouncedSearch.length >= 2 && searchQuery.isLoading && (
            <p className="text-sm text-muted-foreground">Buscando…</p>
          )}

          {/* Erro */}
          {debouncedSearch.length >= 2 && searchQuery.isError && (
            <p className="text-sm text-muted-foreground">
              Não foi possível buscar. Tente novamente.
            </p>
          )}

          {/* Sem resultados */}
          {debouncedSearch.length >= 2 &&
            !searchQuery.isLoading &&
            !searchQuery.isError &&
            results.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Nenhum membro encontrado.
              </p>
            )}

          {/* Lista de resultados */}
          {results.length > 0 && (
            <ScrollArea className="max-h-[400px]">
              <div className="divide-y divide-border/50">
                {results.map((member) => (
                  <button
                    key={member.user_id}
                    type="button"
                    onClick={() => handleNavigate(member.username)}
                    disabled={!member.username}
                    className="flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-muted/30 focus:bg-muted/30 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Avatar className="h-12 w-12 border border-border/60">
                      <AvatarImage
                        src={member.avatar_url ?? undefined}
                        alt={member.display_name}
                      />
                      <AvatarFallback>
                        <User className="h-5 w-5 text-muted-foreground" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">
                        {member.display_name}
                      </div>
                      {member.username && (
                        <div className="truncate text-xs text-muted-foreground">
                          {member.username}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
