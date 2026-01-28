import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Home = () => {
  return (
    <main className="invictus-page">
      <header className="invictus-page-header">
        <h1 className="invictus-h1">Bem-vindo</h1>
        <p className="invictus-lead">
          Últimas atualizações, avisos e eventos da Fraternidade.
        </p>
      </header>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Card className="invictus-surface invictus-frame border border-border/70">
            <CardHeader>
              <CardTitle className="text-base">Acontecendo agora</CardTitle>
              <CardDescription>Atualizações em tempo real (placeholder).</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Reunião de alinhamento — hoje, 20:00</li>
                <li>• Novo comunicado disponível na área de avisos</li>
                <li>• Destaque da semana: integração e networking</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="invictus-surface invictus-frame border border-border/70">
            <CardHeader>
              <CardTitle className="text-base">Próximos eventos</CardTitle>
              <CardDescription>Calendário e detalhes (placeholder).</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-border/60 p-3">
                  <p className="text-sm font-medium">Encontro mensal</p>
                  <p className="mt-1 text-xs text-muted-foreground">Sáb • 19:00 • Sede</p>
                </div>
                <div className="rounded-lg border border-border/60 p-3">
                  <p className="text-sm font-medium">Ação solidária</p>
                  <p className="mt-1 text-xs text-muted-foreground">Dom • 10:00 • Centro</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-4">
          <Card className="invictus-surface invictus-frame border border-border/70">
            <CardHeader>
              <CardTitle className="text-base">Bem-vindo</CardTitle>
              <CardDescription>Mensagem inicial (placeholder).</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Use esta área para recados rápidos, links importantes e instruções para os membros.
              </p>
            </CardContent>
          </Card>

          <Card className="invictus-surface invictus-frame border border-border/70">
            <CardHeader>
              <CardTitle className="text-base">Avisos</CardTitle>
              <CardDescription>Comunicados e alertas (placeholder).</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Atualização importante: regras de presença</li>
                <li>• Confirme participação no próximo evento</li>
                <li>• Novos materiais adicionados no perfil</li>
              </ul>
            </CardContent>
          </Card>
        </aside>
      </section>
    </main>
  );
};

export default Home;
