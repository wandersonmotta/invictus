import * as React from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { GoldHoverText } from "@/components/GoldHoverText";
import logo from "@/assets/invictus-logo.png";

const schema = z
  .object({
    password: z.string().min(8, "Senha precisa ter pelo menos 8 caracteres"),
    confirmPassword: z.string().min(8, "Senha precisa ter pelo menos 8 caracteres"),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "As senhas não conferem",
  });

type FormValues = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const { toast } = useToast();
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = React.useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const onSubmit = async (values: FormValues) => {
    if (saving) return;
    setSaving(true);

    const { error } = await supabase.auth.updateUser({ password: values.password });
    setSaving(false);

    if (error) {
      toast({
        title: "Não foi possível atualizar a senha",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({ title: "Senha atualizada", description: "Você já pode acessar normalmente." });
    navigate("/", { replace: true });
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
              <CardTitle className="text-lg sm:text-xl">Redefinir senha</CardTitle>
              <CardDescription>Escolha uma nova senha para sua conta.</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="py-6 text-sm text-muted-foreground">Carregando…</div>
          ) : !session ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Não encontramos uma sessão de recuperação ativa. Abra o link do e-mail novamente.
              </p>
              <Button type="button" className="w-full h-11" onClick={() => navigate("/auth")}>
                Voltar para o acesso
              </Button>
            </div>
          ) : (
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Nova senha</Label>
                <Input id="password" type="password" autoComplete="new-password" {...form.register("password")} />
                {form.formState.errors.password && (
                  <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  {...form.register("confirmPassword")}
                />
                {form.formState.errors.confirmPassword && (
                  <p className="text-xs text-destructive">{form.formState.errors.confirmPassword.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full h-11" disabled={saving}>
                {saving ? "Salvando…" : "Salvar nova senha"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
