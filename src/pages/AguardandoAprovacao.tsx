import { useAuth } from "@/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

export default function AguardandoAprovacao() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <main className="invictus-page">
      <header className="invictus-page-header">
        <h1 className="invictus-h1">Aguardando aprovação</h1>
        <p className="invictus-lead">Seu acesso foi criado com convite, mas ainda precisa ser liberado.</p>
      </header>

      <Card className="invictus-surface invictus-frame border-border/70">
        <CardHeader>
          <CardTitle className="text-base">Status</CardTitle>
          <CardDescription>
            Assim que um administrador aprovar, seu acesso total será liberado automaticamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground break-all">
            <span className="font-medium text-foreground">E-mail:</span> {user?.email ?? "—"}
          </p>
          <div className="rounded-md border border-border/70 bg-muted/40 p-3 text-sm text-muted-foreground">
            Enquanto isso, você já pode completar seu perfil: <span className="text-foreground font-medium">foto</span>,{" "}
            <span className="text-foreground font-medium">bio</span>,{" "}
            <span className="text-foreground font-medium">expertises</span> e{" "}
            <span className="text-foreground font-medium">região</span>.
          </div>
          <Button onClick={() => navigate("/perfil")}>Completar perfil</Button>
          <Button variant="secondary" onClick={() => void signOut()}>
            Sair
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
