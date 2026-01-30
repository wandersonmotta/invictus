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
import { EditorialMedia } from "@/components/landing/EditorialMedia";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import waitlistMediaPrimary from "@/assets/invictus-landing-waitlist-media-color-v3d.jpg";
import waitlistMediaFallback from "@/assets/invictus-landing-waitlist-media-color.jpg";
import invictusLogo from "@/assets/invictus-logo.png";

const waitlistSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(3, "Informe seu nome completo")
    .max(120, "Nome muito longo"),
  phone: z
    .string()
    .trim()
    .min(8, "Informe seu WhatsApp")
    .max(32, "Número muito longo"),
  email: z.string().trim().max(255, "E-mail muito longo").email("Informe um e-mail válido"),
});

type WaitlistValues = z.infer<typeof waitlistSchema>;

export function WaitlistHero() {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [mediaSrc, setMediaSrc] = React.useState<string>(waitlistMediaPrimary);

  const form = useForm<WaitlistValues>({
    resolver: zodResolver(waitlistSchema),
    defaultValues: { fullName: "", phone: "", email: "" },
  });

  const phoneDigits = (raw: string) => raw.replace(/\D+/g, "");

  const onSubmit = async (values: WaitlistValues) => {
    if (loading) return;
    setLoading(true);
    try {
      const digits = phoneDigits(values.phone);
      if (digits.length < 10 || digits.length > 13) {
        form.setError("phone", { message: "Informe um WhatsApp válido (DDD + número)" });
        return;
      }

      const { error } = await supabase.functions.invoke("waitlist-signup", {
        body: {
          email: values.email,
          full_name: values.fullName,
          phone: digits,
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
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="px-4 pb-12 pt-6 sm:px-6 sm:pb-16" aria-labelledby="waitlist-title">
      <div className="mx-auto w-full max-w-6xl">
        <Card className="invictus-auth-surface invictus-auth-frame border-0">
          <CardHeader className="space-y-2">
            <p className="text-xs font-medium tracking-wide text-muted-foreground">Entrada por decisão</p>
            <CardTitle id="waitlist-title" className="text-balance text-2xl sm:text-3xl">
              Lista de espera
            </CardTitle>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Se você quer operar no modo sério, entre para ser avisado quando abrirmos novas entradas.
            </p>
          </CardHeader>

          <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex w-full flex-col gap-4 sm:w-auto sm:flex-row sm:items-center">
              {/* reduzido e escondido no mobile para não tomar tela */}
              <div className="relative sm:w-[240px] md:w-[260px]">
                <EditorialMedia
                  src={mediaSrc}
                  className="w-full"
                  loading="eager"
                  onError={() => {
                    // Se o asset novo falhar por algum motivo, usamos o fallback já estável (1x).
                    setMediaSrc((prev) => (prev !== waitlistMediaFallback ? waitlistMediaFallback : prev));
                  }}
                />

                {/* Logo como overlay real (evita artefatos de texto na geração) */}
                <div
                  className="pointer-events-none absolute inset-0 flex items-center justify-center"
                  aria-hidden="true"
                >
                  <img
                    src={invictusLogo}
                    alt=""
                    className="w-16 opacity-70 mix-blend-overlay"
                    loading="eager"
                    decoding="async"
                  />
                </div>
              </div>

              <div className="inline-flex items-center gap-3 rounded-lg border border-border/60 bg-background/40 px-4 py-3 backdrop-blur">
                <span className="text-sm text-muted-foreground">Sem promessa fácil.</span>
                <GoldHoverText className="text-sm font-medium">Só processo.</GoldHoverText>
              </div>
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="h-11 w-full sm:w-auto" disabled={loading}>
                  Quero fazer parte
                </Button>
              </DialogTrigger>
              <DialogContent className="border-0 invictus-auth-surface invictus-auth-frame">
                <DialogHeader>
                  <DialogTitle>Quero fazer parte</DialogTitle>
                  <DialogDescription>
                    Preencha os dados abaixo. Entraremos em contato quando houver novas entradas.
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="waitlist-fullname">Nome completo</Label>
                    <Input
                      id="waitlist-fullname"
                      autoComplete="name"
                      placeholder="Seu nome"
                      {...form.register("fullName")}
                    />
                    {form.formState.errors.fullName && (
                      <p className="text-xs text-destructive">{form.formState.errors.fullName.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="waitlist-phone">WhatsApp</Label>
                    <Input
                      id="waitlist-phone"
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder="(11) 99999-9999"
                      {...form.register("phone")}
                    />
                    {form.formState.errors.phone && (
                      <p className="text-xs text-destructive">{form.formState.errors.phone.message}</p>
                    )}
                  </div>

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
                    {loading ? "Enviando…" : "Entrar na lista"}
                  </Button>

                  <p className="text-xs text-muted-foreground">
                    Disciplina em primeiro lugar. Resultado como regra.
                  </p>
                </form>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
