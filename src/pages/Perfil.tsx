import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Perfil() {
  return (
    <main className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold">Perfil</h1>
        <p className="text-sm text-muted-foreground">Seu perfil executivo (placeholder).</p>
      </header>

      <Card className="bg-card/50 backdrop-blur-xl border-border/70 shadow-[0_0_0_1px_hsl(var(--border)/0.4)]">
        <CardHeader>
          <CardTitle>Em breve</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Aqui vamos incluir foto, bio, expertises e região.
        </CardContent>
      </Card>
    </main>
  );
}
