import * as React from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const schema = z
  .object({
    currentPassword: z.string().min(1, "Informe sua senha atual"),
    newPassword: z.string().min(8, "Senha precisa ter pelo menos 8 caracteres"),
    confirmNewPassword: z.string().min(8, "Senha precisa ter pelo menos 8 caracteres"),
  })
  .refine((v) => v.newPassword === v.confirmNewPassword, {
    path: ["confirmNewPassword"],
    message: "As senhas não conferem",
  });

type FormValues = z.infer<typeof schema>;

function isInvalidCredentials(message?: string) {
  const m = (message ?? "").toLowerCase();
  return m.includes("invalid login credentials") || m.includes("invalid credentials");
}

function isRequiresRecentLogin(message?: string) {
  const m = (message ?? "").toLowerCase();
  return m.includes("requires recent") || m.includes("reauth");
}

export function ChangePasswordCard({ email }: { email: string }) {
  const { toast } = useToast();
  const [saving, setSaving] = React.useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { currentPassword: "", newPassword: "", confirmNewPassword: "" },
  });

  const onSubmit = async (values: FormValues) => {
    if (saving) return;
    setSaving(true);

    // 1) Reautentica para confirmar a senha atual (e renovar sessão, quando exigido)
    const { error: reauthError } = await supabase.auth.signInWithPassword({
      email,
      password: values.currentPassword,
    });

    if (reauthError) {
      setSaving(false);
      toast({
        title: isInvalidCredentials(reauthError.message) ? "Senha atual incorreta" : "Não foi possível confirmar sua senha",
        description: isInvalidCredentials(reauthError.message) ? "Verifique e tente novamente." : reauthError.message,
        variant: "destructive",
      });
      return;
    }

    // 2) Atualiza senha
    const { error: updateError } = await supabase.auth.updateUser({ password: values.newPassword });
    setSaving(false);

    if (updateError) {
      toast({
        title: "Não foi possível atualizar a senha",
        description: isRequiresRecentLogin(updateError.message)
          ? "Por segurança, faça logout e login novamente e tente de novo."
          : updateError.message,
        variant: "destructive",
      });
      return;
    }

    toast({ title: "Senha atualizada", description: "Sua senha foi alterada com sucesso." });
    form.reset();
  };

  return (
    <Card className="invictus-modal-glass">
      <CardHeader className="space-y-1">
        <CardTitle className="text-base">Alterar senha</CardTitle>
        <CardDescription>Confirme sua senha atual e defina uma nova.</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Senha atual</Label>
            <Input
              id="currentPassword"
              type="password"
              autoComplete="current-password"
              {...form.register("currentPassword")}
            />
            {form.formState.errors.currentPassword && (
              <p className="text-xs text-destructive">{form.formState.errors.currentPassword.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">Nova senha</Label>
            <Input id="newPassword" type="password" autoComplete="new-password" {...form.register("newPassword")} />
            {form.formState.errors.newPassword && (
              <p className="text-xs text-destructive">{form.formState.errors.newPassword.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmNewPassword">Repetir nova senha</Label>
            <Input
              id="confirmNewPassword"
              type="password"
              autoComplete="new-password"
              {...form.register("confirmNewPassword")}
            />
            {form.formState.errors.confirmNewPassword && (
              <p className="text-xs text-destructive">{form.formState.errors.confirmNewPassword.message}</p>
            )}
          </div>

          <Button type="submit" className="h-11" disabled={saving}>
            {saving ? "Salvando…" : "Salvar nova senha"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
