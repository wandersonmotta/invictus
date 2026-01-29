import { useAuth } from "@/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { ChangePasswordCard } from "@/components/profile/ChangePasswordCard";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
export default function Perfil() {
  const {
    user,
    signOut
  } = useAuth();
  return <main className="invictus-page">
      <header className="invictus-page-header">
        <h1 className="invictus-h1">Perfil</h1>
        <p className="invictus-lead">Complete o seu perfil — mesmo durante a aprovação.</p>
      </header>

      {user?.id ? <ProfileForm userId={user.id} /> : null}

      <section className="invictus-surface invictus-frame border-border/70 rounded-xl p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold">Alterar senha</h2>
            <p className="text-sm text-muted-foreground">Esqueceu sua senha? Clique para trocar sua senha com segurança.</p>
          </div>

          {user?.email ? <Dialog>
              <DialogTrigger asChild>
                <Button type="button" className="h-11">
                  Alterar senha
                </Button>
              </DialogTrigger>
              <DialogContent className="border-0 bg-transparent p-0 shadow-none">
                <DialogHeader className="sr-only">
                  <DialogTitle>Alterar senha</DialogTitle>
                  <DialogDescription>Formulário para alteração de senha.</DialogDescription>
                </DialogHeader>
                <ChangePasswordCard email={user.email} />
              </DialogContent>
            </Dialog> : <Button type="button" className="h-11" disabled>
              Alterar senha
            </Button>}
        </div>

        {!user?.email ? <p className="mt-3 text-xs text-muted-foreground">
            Sua conta não suporta alteração de senha por aqui.
          </p> : null}
      </section>

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
    </main>;
}