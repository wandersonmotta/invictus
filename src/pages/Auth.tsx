import * as React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { useAuth } from "@/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
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
import { useToast } from "@/hooks/use-toast";
import { GoldHoverText } from "@/components/GoldHoverText";
import logo from "@/assets/invictus-logo.png";

const loginSchema = z.object({
  email: z.string().trim().max(255, "E-mail muito longo").email("Informe um e-mail válido"),
  password: z.string().min(8, "Senha precisa ter pelo menos 8 caracteres").max(72, "Senha muito longa"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const inviteSchema = z.object({
  inviteCode: z.string().trim().min(4, "Informe o código do convite").max(64, "Código inválido"),
  email: z.string().trim().max(255, "E-mail muito longo").email("Informe um e-mail válido"),
  password: z.string().min(8, "Senha precisa ter pelo menos 8 caracteres").max(72, "Senha muito longa"),
});

type InviteFormValues = z.infer<typeof inviteSchema>;

const resetSchema = z.object({
  email: z.string().trim().max(255, "E-mail muito longo").email("Informe um e-mail válido"),
});

type ResetFormValues = z.infer<typeof resetSchema>;

export default function AuthPage() {
  const { toast } = useToast();
  const { session, signIn, resetPassword } = useAuth();
  const [resetOpen, setResetOpen] = React.useState(false);
  const [resetLoading, setResetLoading] = React.useState(false);
  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [inviteLoading, setInviteLoading] = React.useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from ?? "/";

  React.useEffect(() => {
    if (session) navigate(from, { replace: true });
  }, [session, navigate, from]);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const inviteForm = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { inviteCode: "", email: "", password: "" },
  });

  const resetForm = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { email: "" },
  });

  const onLoginSubmit = async (values: LoginFormValues) => {
    const { error } = await signIn(values.email, values.password);
    if (error) {
      toast({
        title: "Não foi possível autenticar",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Bem-vindo",
      description: "Você entrou com sucesso.",
    });
  };

  const onInviteSubmit = async (values: InviteFormValues) => {
    if (inviteLoading) return;
    setInviteLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("auth-signup-with-invite", {
        body: {
          inviteCode: values.inviteCode,
          email: values.email,
          password: values.password,
        },
      });

      if (error) {
        const msg = String((error as any)?.message ?? "");
        const hint = String((data as any)?.error ?? "");
        const key = hint || msg;

        const friendly =
          key.includes("invite_expired")
            ? "Esse convite expirou."
            : key.includes("invite_used")
              ? "Esse convite já foi utilizado."
              : key.includes("invite_invalid")
                ? "Convite inválido."
                : key.includes("email_already_registered")
                  ? "Este e-mail já está cadastrado."
                  : "Não foi possível criar sua conta.";

        toast({ title: "Falha no convite", description: friendly, variant: "destructive" });
        return;
      }

      toast({
        title: "Conta criada",
        description: "Agora faça login para entrar. Seu acesso pode ficar limitado até aprovação.",
      });
      inviteForm.reset();
      setInviteOpen(false);
    } finally {
      setInviteLoading(false);
    }
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
    <main className="invictus-auth-page min-h-svh grid place-items-center p-4 sm:p-6">
      <Card className="invictus-auth-surface invictus-auth-frame w-full max-w-md border-0">
        <CardHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-center gap-1">
              <img
                src={logo}
                alt="Logo da Invictus"
                className="h-10 w-auto select-none"
                draggable={false}
                style={{ filter: "drop-shadow(0 0 10px hsl(var(--primary) / 0.25))" }}
              />
              <GoldHoverText className="text-[10px] font-semibold tracking-[0.35em]">FRATERNIDADE</GoldHoverText>
            </div>
            <div>
              <CardTitle className="sr-only">Invictus</CardTitle>
              <CardDescription>Acesso exclusivo para membros</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" autoComplete="email" {...loginForm.register("email")} />
              {loginForm.formState.errors.email && (
                <p className="text-xs text-destructive">{loginForm.formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" autoComplete="current-password" {...loginForm.register("password")} />
              {loginForm.formState.errors.password && (
                <p className="text-xs text-destructive">{loginForm.formState.errors.password.message}</p>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Button type="submit" className="h-11 w-full">
                Entrar
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => setInviteOpen(true)}
                className={
                  "h-11 w-full group border-border/70 hover:bg-[hsl(var(--gold-soft)/0.12)] hover:border-[hsl(var(--gold-hot)/0.55)] hover:shadow-[0_0_0_1px_hsl(var(--gold-hot)/0.20),0_10px_30px_-12px_hsl(var(--primary)/0.35)]"
                }
              >
                <GoldHoverText className="text-sm font-medium" intensity={1}>
                  Tenho um convite
                </GoldHoverText>
              </Button>
            </div>

            <button
              type="button"
              onClick={() => setResetOpen(true)}
              className="w-full text-center text-xs text-muted-foreground underline-offset-4 hover:underline"
            >
              Esqueceu a senha?
            </button>
          </form>
        </CardContent>
      </Card>

      <Dialog open={inviteOpen} onOpenChange={(o) => (inviteLoading ? null : setInviteOpen(o))}>
        <DialogContent className="invictus-auth-surface invictus-auth-frame border-0">
          <DialogHeader>
            <DialogTitle>Entrar com convite</DialogTitle>
            <DialogDescription>Crie sua conta usando um código de convite válido.</DialogDescription>
          </DialogHeader>

          <form onSubmit={inviteForm.handleSubmit(onInviteSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invite">Código do convite</Label>
              <Input id="invite" autoComplete="off" {...inviteForm.register("inviteCode")} />
              {inviteForm.formState.errors.inviteCode && (
                <p className="text-xs text-destructive">{inviteForm.formState.errors.inviteCode.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="invite-email">E-mail</Label>
              <Input id="invite-email" type="email" autoComplete="email" {...inviteForm.register("email")} />
              {inviteForm.formState.errors.email && (
                <p className="text-xs text-destructive">{inviteForm.formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="invite-password">Senha</Label>
              <Input id="invite-password" type="password" autoComplete="new-password" {...inviteForm.register("password")} />
              {inviteForm.formState.errors.password && (
                <p className="text-xs text-destructive">{inviteForm.formState.errors.password.message}</p>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" className="h-11" onClick={() => setInviteOpen(false)} disabled={inviteLoading}>
                Cancelar
              </Button>
              <Button type="submit" className="h-11" disabled={inviteLoading}>
                {inviteLoading ? "Criando…" : "Criar conta"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={resetOpen} onOpenChange={(o) => (resetLoading ? null : setResetOpen(o))}>
          <DialogContent className="invictus-auth-surface invictus-auth-frame border-0">
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
