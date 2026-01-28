import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Buscar() {
  return (
    <main className="invictus-page">
      <header className="invictus-page-header">
        <h1 className="invictus-h1">Buscar</h1>
        <p className="invictus-lead">Encontre membros por região, expertise e setor (placeholder).</p>
      </header>

      <Card className="invictus-surface invictus-frame border-border/70">
        <CardHeader>
          <CardTitle>Em breve</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Aqui vai entrar a busca premium com filtros e cards.
        </CardContent>
      </Card>
    </main>
  );
}
