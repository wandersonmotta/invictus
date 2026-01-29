import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { supabase } from "@/integrations/supabase/client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type SearchResult = {
  user_id: string;
  display_name: string;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  city: string | null;
  state: string | null;
  region: string | null;
};

function normalizeUsernameQuery(v: string) {
  const t = v.trim().toLowerCase();
  if (!t) return "";
  return t.startsWith("@") ? t : `@${t}`;
}

export default function Buscar() {
  const [input, setInput] = React.useState("");
  const [submitted, setSubmitted] = React.useState<string>("");
  const navigate = useNavigate();

  const resultQuery = useQuery({
    queryKey: ["find_approved_member_by_username", submitted],
    enabled: !!submitted,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("find_approved_member_by_username", { p_username: submitted });
      if (error) throw error;
      const row = (data?.[0] ?? null) as SearchResult | null;
      return row;
    },
    staleTime: 10_000,
  });

  const followStatsQuery = useQuery({
    queryKey: ["follow_stats", resultQuery.data?.user_id],
    enabled: !!resultQuery.data?.user_id,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_follow_stats", { p_user_id: resultQuery.data!.user_id });
      if (error) throw error;
      return (data?.[0] ?? { followers_count: 0, following_count: 0, is_following: false }) as any;
    },
    staleTime: 10_000,
  });

  return (
    <main className="invictus-page">
      <header className="invictus-page-header">
        <h1 className="invictus-h1">Buscar</h1>
        <p className="invictus-lead">Encontre membros pelo @ do perfil.</p>
      </header>

      <Card className="invictus-surface invictus-frame border-border/70">
        <CardHeader>
          <CardTitle>Buscar por @</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            className="flex flex-col gap-2 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              setSubmitted(normalizeUsernameQuery(input));
            }}
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="@joao.silva"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
            />
            <div className="flex gap-2">
              <Button type="submit" className="h-10">
                Buscar
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="h-10"
                onClick={() => {
                  setInput("");
                  setSubmitted("");
                }}
              >
                Limpar
              </Button>
            </div>
          </form>

          {!submitted ? (
            <p className="text-sm text-muted-foreground">Digite um @ para buscar (ex.: @meu.usuario).</p>
          ) : resultQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Buscando…</p>
          ) : resultQuery.isError ? (
            <p className="text-sm text-muted-foreground">Não foi possível buscar esse @.</p>
          ) : resultQuery.data ? (
            <div className="flex items-start gap-3 rounded-lg border border-border/60 p-4">
              {resultQuery.data.avatar_url ? (
                <img
                  src={resultQuery.data.avatar_url}
                  alt={`Avatar de ${resultQuery.data.display_name}`}
                  className="h-12 w-12 rounded-full border border-border/70 object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="h-12 w-12 rounded-full border border-border/70 invictus-surface" />
              )}
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{resultQuery.data.display_name}</div>
                {resultQuery.data.username ? (
                  <div className="truncate text-xs text-muted-foreground">{resultQuery.data.username}</div>
                ) : null}
                <div className="mt-2 text-xs text-muted-foreground">
                  {resultQuery.data.city || resultQuery.data.state ? (
                    <span>
                      {resultQuery.data.city ?? "—"}
                      {resultQuery.data.state ? `/${resultQuery.data.state}` : ""}
                    </span>
                  ) : (
                    <span>Localização não informada</span>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={async () => {
                      await supabase.rpc("toggle_follow", { p_target_user_id: resultQuery.data!.user_id });
                      await followStatsQuery.refetch();
                    }}
                  >
                    {followStatsQuery.data?.is_following ? "Seguindo" : "Seguir"}
                  </Button>

                  <Button
                    type="button"
                    onClick={async () => {
                      const { data: auth } = await supabase.auth.getUser();
                      const me = auth.user?.id;
                      if (!me) return;
                      const { data, error } = await supabase.rpc("create_conversation", {
                        p_type: "direct",
                        p_member_ids: [me, resultQuery.data!.user_id],
                      });
                      if (error) throw error;
                      const conversationId = data as unknown as string;
                      navigate(`/mensagens/${conversationId}`);
                    }}
                  >
                    Mensagem
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const u = resultQuery.data?.username;
                      if (!u) return;
                      navigate(`/membro/${encodeURIComponent(u.replace(/^@/, ""))}`);
                    }}
                    disabled={!resultQuery.data.username}
                  >
                    Ver perfil
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum membro encontrado com esse @.</p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
