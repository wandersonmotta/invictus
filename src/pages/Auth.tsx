import * as React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { useAuth } from "@/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/invictus-logo.png";

const schema = z.object({
  email: z.string().email("Informe um e-mail válido"),
  password: z.string().min(8, "Senha precisa ter pelo menos 8 caracteres"),
});

type FormValues = z.infer<typeof schema>;

const resetSchema = z.object({
  email: z.string().trim().max(255, "E-mail muito longo").email("Informe um e-mail válido"),
});

type ResetFormValues = z.infer<typeof resetSchema>;

export default function AuthPage() {
  const { toast } = useToast();
  const { session, signIn, signUp, resetPassword } = useAuth();
  const [mode, setMode] = React.useState<"login" | "signup">("login");
  const [resetOpen, setResetOpen] = React.useState(false);
  const [resetLoading, setResetLoading] = React.useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from ?? "/";

  React.useEffect(() => {
    if (session) navigate(from, { replace: true });
  }, [session, navigate, from]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const resetForm = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (values: FormValues) => {
    const fn = mode === "login" ? signIn : signUp;
    const { error } = await fn(values.email, values.password);
    if (error) {
      toast({
        title: "Não foi possível autenticar",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: mode === "login" ? "Bem-vindo" : "Conta criada",
      description:
        mode === "login"
          ? "Você entrou com sucesso."
          : "Se necessário, verifique seu e-mail para confirmar o acesso.",
    });
  };

  const onResetSubmit = async (values: ResetFormValues) => {
    if (resetLoading) return;
    setResetLoading(true);

    const { error } = await resetPassword(values.email);
    setResetLoading(false);

    if (error) {
      toast({
        title: "Não foi possível enviar o link",
        description: "Tente novamente em instantes.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "E-mail enviado",
      description: "Se este e-mail existir, você receberá um link para redefinir a senha.",
    });

    resetForm.reset();
    setResetOpen(false);
  };

  return (
    <main className="min-h-svh grid place-items-center p-4 sm:p-6">
      <Card className="invictus-surface invictus-frame w-full max-w-md border-border/70">
        <CardHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <img
              src={logo}
              alt="Logo da Invictus"
              className="h-10 w-auto select-none"
              draggable={false}
              style={{ filter: "drop-shadow(0 0 10px hsl(var(--primary) / 0.25))" }}
            />
            <div>
              <CardTitle className="sr-only">Invictus</CardTitle>
              <CardDescription>Acesso exclusivo para membros</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs
            value={mode}
            onValueChange={(v) => setMode(v as "login" | "signup")}
            className="w-full"
          >
            <TabsList className="grid h-11 w-full grid-cols-2">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Criar conta</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-4">
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" type="email" autoComplete="email" {...form.register("email")} />
                  {form.formState.errors.email && (
                    <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    {...form.register("password")}
                  />
                  {form.formState.errors.password && (
                    <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
                  )}
                </div>

                <Button type="submit" className="w-full h-11">
                  Entrar
                </Button>

                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => setResetOpen(true)}
                    className="text-xs text-muted-foreground underline-offset-4 hover:underline"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="mt-4">
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email2">E-mail</Label>
                  <Input id="email2" type="email" autoComplete="email" {...form.register("email")} />
                  {form.formState.errors.email && (
                    <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password2">Senha</Label>
                  <Input id="password2" type="password" autoComplete="new-password" {...form.register("password")} />
                  {form.formState.errors.password && (
                    <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
                  )}
                </div>

                <Button type="submit" className="w-full h-11">
                  Criar conta
                </Button>

                <p className="text-xs text-muted-foreground">
                  Dica: em ambiente de teste, a confirmação automática de e-mail está habilitada.
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={resetOpen} onOpenChange={(o) => (resetLoading ? null : setResetOpen(o))}>
          <DialogContent className="invictus-surface invictus-frame border-border/70">
          <DialogHeader>
            <DialogTitle>Recuperar acesso</DialogTitle>
            <DialogDescription>Informe seu e-mail para receber um link de redefinição de senha.</DialogDescription>
          </DialogHeader>

          <form onSubmit={resetForm.handleSubmit(onResetSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email">E-mail</Label>
              <Input id="reset-email" type="email" autoComplete="email" {...resetForm.register("email")} />
              {resetForm.formState.errors.email && (
                <p className="text-xs text-destructive">{resetForm.formState.errors.email.message}</p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="h-11"
                onClick={() => setResetOpen(false)}
                disabled={resetLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" className="h-11" disabled={resetLoading}>
                {resetLoading ? "Enviando…" : "Enviar link"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
