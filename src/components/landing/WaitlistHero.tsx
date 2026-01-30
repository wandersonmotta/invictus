import * as React from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { GoldHoverText } from "@/components/GoldHoverText";

const waitlistSchema = z.object({
  email: z.string().trim().max(255, "E-mail muito longo").email("Informe um e-mail válido"),
});

type WaitlistValues = z.infer<typeof waitlistSchema>;

export function WaitlistHero() {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);

  const form = useForm<WaitlistValues>({
    resolver: zodResolver(waitlistSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (values: WaitlistValues) => {
    if (loading) return;
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke("waitlist-signup", {
        body: {
          email: values.email,
          source: "landing",
        },
      });

      if (error) {
        toast({
          title: "Não foi possível entrar na lista",
          description: "Tente novamente em instantes.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Você entrou na lista de espera",
        description: "Quando abrirmos novas vagas, você será avisado.",
      });
      form.reset();
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="px-4 pb-10 pt-2 sm:px-6 sm:pb-16">
      <div className="mx-auto grid w-full max-w-6xl gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
        <div className="space-y-6">
          <div className="space-y-3">
            <p className="text-sm font-medium tracking-wide text-muted-foreground">
              Não é um grupo. Não é um produto. Não é para todos.
            </p>
            <h1 className="text-balance text-4xl font-semibold leading-[1.05] sm:text-5xl">
              <span className="block">INVICTUS é uma decisão.</span>
            </h1>
            <p className="max-w-xl text-pretty text-base leading-relaxed text-muted-foreground">
              A Fraternidade Invictus existe para formar homens e mulheres indestrutíveis — liderança, disciplina inegociável e obsessão por resultado.
            </p>
          </div>

          <div className="inline-flex items-center gap-3 rounded-lg border border-border/60 bg-background/40 px-4 py-3 backdrop-blur">
            <span className="text-sm text-muted-foreground">Disciplina em primeiro lugar.</span>
            <GoldHoverText className="text-sm font-medium">Transformação real.</GoldHoverText>
          </div>
        </div>

        <Card className="invictus-auth-surface invictus-auth-frame border-0">
          <CardHeader className="space-y-2">
            <CardTitle className="text-xl">Lista de espera</CardTitle>
            <p className="text-sm text-muted-foreground">Entre para ser avisado quando abrirmos novas entradas.</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="waitlist-email">E-mail</Label>
                <Input
                  id="waitlist-email"
                  type="email"
                  autoComplete="email"
                  placeholder="seuemail@exemplo.com"
                  {...form.register("email")}
                />
                {form.formState.errors.email && (
                  <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
                )}
              </div>

              <Button type="submit" className="h-11 w-full" disabled={loading}>
                {loading ? "Enviando…" : "Quero entrar"}
              </Button>

              <p className="text-xs text-muted-foreground">
                Não existe promessa fácil. Existe processo, verdade e consequência.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
