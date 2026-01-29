import { useMemo, useState } from "react";
import { useAuth } from "@/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { ChangePasswordCard } from "@/components/profile/ChangePasswordCard";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MyProfilePreview } from "@/components/profile/MyProfilePreview";
export default function Perfil() {
  const {
    user,
    signOut
  } = useAuth();
  const [showEmail, setShowEmail] = useState(false);
  const [tab, setTab] = useState("edit");
  const [refreshKey, setRefreshKey] = useState(0);

  const maskedEmail = useMemo(() => {
    const email = user?.email ?? "";
    const [local, domain] = email.split("@");
    if (!local || !domain) return "—";
    const safeLocal = local.length <= 2 ? `${local[0] ?? ""}*` : `${local.slice(0, 2)}***`;
    return `${safeLocal}@${domain}`;
  }, [user?.email]);

  return <main className="invictus-page">
      <header className="invictus-page-header">
        <h1 className="invictus-h1">Perfil</h1>
        <p className="invictus-lead">Complete o seu perfil — mesmo durante a aprovação.</p>
      </header>

      <Tabs value={tab} onValueChange={setTab}>
        <div className="mx-auto w-full max-w-[480px]">
          <TabsList>
            <TabsTrigger value="edit">Editar perfil</TabsTrigger>
            <TabsTrigger value="preview">Ver como fica</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="edit" className="mt-4 space-y-6">
          {user?.id ? (
            <ProfileForm userId={user.id} onSaved={() => setRefreshKey((v) => v + 1)} />
          ) : null}

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
                  <span className="font-medium text-foreground">E-mail:</span> {showEmail ? user?.email ?? "—" : maskedEmail}
                  {user?.email ? <Button type="button" variant="ghost" size="sm" className="ml-2 h-7 px-2" onClick={() => setShowEmail(v => !v)}>
                      {showEmail ? "Ocultar" : "Mostrar"}
                    </Button> : null}
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
        </TabsContent>

        <TabsContent value="preview" className="mt-4">
          {user?.id ? <MyProfilePreview userId={user.id} refreshKey={refreshKey} /> : null}
        </TabsContent>
      </Tabs>
    </main>;
}