import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Buscar() {
  return (
    <main className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold">Buscar</h1>
        <p className="text-sm text-muted-foreground">Encontre membros por região, expertise e setor (placeholder).</p>
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
