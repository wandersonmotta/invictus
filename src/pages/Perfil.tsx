import { useAuth } from "@/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Perfil() {
  const { user, signOut } = useAuth();

  return (
    <main className="invictus-page">
      <header className="invictus-page-header">
        <h1 className="invictus-h1">Perfil</h1>
        <p className="invictus-lead">Seu perfil executivo (placeholder).</p>
      </header>

      <Card className="invictus-surface invictus-frame border-border/70">
        <CardHeader>
          <CardTitle>Em breve</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Aqui vamos incluir foto, bio, expertises e região.
        </CardContent>
      </Card>

      <Card className="invictus-surface invictus-frame border-border/70">
        <CardHeader>
          <CardTitle className="text-base">Sessão</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">E-mail:</span> {user?.email ?? "—"}
            </p>
            <p className="break-all">
              <span className="font-medium text-foreground">Seu ID:</span> {user?.id ?? "—"}
            </p>
          </div>
          <Button variant="secondary" onClick={() => void signOut()}>
            Sair
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
