import * as React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { useAuth } from "@/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

export default function AuthPage() {
  const { toast } = useToast();
  const { session, signIn, signUp } = useAuth();
  const [mode, setMode] = React.useState<"login" | "signup">("login");
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

  return (
    <main className="min-h-svh grid place-items-center p-4">
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
              <CardTitle>Invictus</CardTitle>
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
            <TabsList className="grid w-full grid-cols-2">
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

                <Button type="submit" className="w-full">
                  Entrar
                </Button>
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

                <Button type="submit" className="w-full">
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
    </main>
  );
}
