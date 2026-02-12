import * as React from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useMagneticHover } from "@/hooks/useMagneticHover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowRight, Lock, ShieldCheck } from "lucide-react";
import waitlistMediaPrimary from "@/assets/invictus-landing-waitlist-media-color-v3d.jpg";

const waitlistSchema = z.object({
  fullName: z.string().trim().min(3, "Informe seu nome completo").max(120, "Nome muito longo"),
  phone: z.string().trim().min(8, "Informe seu WhatsApp").max(32, "Número muito longo"),
  email: z.string().trim().max(255, "E-mail muito longo").email("Informe um e-mail válido")
});

type WaitlistValues = z.infer<typeof waitlistSchema>;

export function WaitlistHero() {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const magneticRef = useMagneticHover<HTMLButtonElement>(0.25);

  const form = useForm<WaitlistValues>({
    resolver: zodResolver(waitlistSchema),
    defaultValues: { fullName: "", phone: "", email: "" }
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
          source: "landing_v4_cinematic"
        }
      });

      if (error) throw error;

      toast({
        title: "PROTOCOLO INICIADO",
        description: "Seus dados foram criptografados e enviados para análise do conselho.",
        variant: "default",
        className: "bg-black text-white border border-primary/20",
      });
      
      form.reset();
      setOpen(false);
    } catch (err) {
      toast({
        title: "FALHA DE COMUNICAÇÃO",
        description: "Erro ao conectar com o servidor seguro. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="waitlist-section" className="relative py-32 bg-black text-white overflow-hidden" aria-labelledby="waitlist-title">
        {/* Cinematic Background */}
        <div className="absolute inset-0 z-0 select-none pointer-events-none">
            <img 
                src={waitlistMediaPrimary} 
                alt="Atmosphere" 
                className="w-full h-full object-cover opacity-20 scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/90 to-transparent" />
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay" />
        </div>

        <div className="container px-4 relative z-10 max-w-4xl mx-auto text-center space-y-12">
            
            {/* Header Block */}
            <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 backdrop-blur-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    <span className="text-[10px] uppercase tracking-[0.3em] font-mono text-primary/80">
                        Vagas Restritas
                    </span>
                </div>

                <h2 id="waitlist-title" className="text-5xl md:text-7xl font-bold tracking-tighter leading-[0.9]">
                    GARANTIR <span className="text-outline-white text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50">VAGA</span>
                </h2>

                <p className="text-muted-foreground text-lg md:text-xl font-light max-w-xl mx-auto leading-relaxed">
                    A Invictus não é para curiosos. O acesso é liberado apenas para quem prova que está pronto para o próximo nível.
                </p>
            </div>

            {/* Action Trigger */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <div className="relative group inline-block">
                        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                        <Button 
                            ref={magneticRef} 
                            className="relative h-16 px-12 bg-white text-black hover:bg-white/90 text-lg font-bold tracking-widest uppercase rounded-none border border-white/50 transition-all duration-300 transform group-hover:scale-105"
                        >
                            <Lock className="w-4 h-4 mr-3" />
                            INICIAR PROTOCOLO
                        </Button>
                    </div>
                </DialogTrigger>
                
                <DialogContent className="border border-white/10 bg-black/95 backdrop-blur-2xl max-w-lg p-0 overflow-hidden gap-0">
                    
                    {/* Modal Header */}
                    <div className="px-8 py-8 border-b border-white/5 bg-white/5">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-[10px] font-mono uppercase tracking-widest text-primary/60 border border-primary/20 px-2 py-1 rounded">
                                Confidencial
                            </span>
                            <ShieldCheck className="w-5 h-5 text-primary/40" />
                        </div>
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold uppercase tracking-wide text-white">
                                Ficha de Aplicação
                            </DialogTitle>
                            <p className="text-sm font-light text-muted-foreground mt-2">
                                Preencha com dados reais. Perfis incompletos são descartados automaticamente pelo sistema.
                            </p>
                        </DialogHeader>
                    </div>

                    {/* Form */}
                    <div className="p-8">
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            
                            <div className="space-y-2">
                                <Label htmlFor="fullName" className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono pl-1">
                                    Nome Operacional
                                </Label>
                                <Input 
                                    id="fullName" 
                                    className="bg-white/5 border-white/10 text-white placeholder:text-white/20 h-12 focus:border-primary/50 focus:ring-0 rounded-sm font-light" 
                                    placeholder="Nome completo" 
                                    {...form.register("fullName")} 
                                />
                                {form.formState.errors.fullName && <p className="text-[10px] text-destructive tracking-wide">{form.formState.errors.fullName.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phone" className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono pl-1">
                                    Contato Seguro (WhatsApp)
                                </Label>
                                <Input 
                                    id="phone" 
                                    inputMode="tel" 
                                    className="bg-white/5 border-white/10 text-white placeholder:text-white/20 h-12 focus:border-primary/50 focus:ring-0 rounded-sm font-light" 
                                    placeholder="(00) 00000-0000" 
                                    {...form.register("phone")} 
                                />
                                {form.formState.errors.phone && <p className="text-[10px] text-destructive tracking-wide">{form.formState.errors.phone.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono pl-1">
                                    Canal de Resposta (E-mail)
                                </Label>
                                <Input 
                                    id="email" 
                                    type="email" 
                                    className="bg-white/5 border-white/10 text-white placeholder:text-white/20 h-12 focus:border-primary/50 focus:ring-0 rounded-sm font-light" 
                                    placeholder="email@dominio.com" 
                                    {...form.register("email")} 
                                />
                                {form.formState.errors.email && <p className="text-[10px] text-destructive tracking-wide">{form.formState.errors.email.message}</p>}
                            </div>

                            <Button 
                                type="submit" 
                                className="w-full h-14 bg-primary text-black hover:bg-primary/90 font-bold tracking-widest uppercase rounded-sm mt-4 group" 
                                disabled={loading}
                            >
                                {loading ? (
                                    <span className="animate-pulse">Processando...</span>
                                ) : (
                                    <span className="flex items-center justify-center gap-2">
                                        Enviar Protocolo <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </span>
                                )}
                            </Button>

                        </form>
                    </div>

                    {/* Footer */}
                    <div className="bg-black/40 p-4 text-center border-t border-white/5">
                        <p className="text-[9px] text-muted-foreground/40 font-mono uppercase tracking-widest">
                            ID SESSÃO: {Math.random().toString(36).substr(2, 9).toUpperCase()} // CRIPTOGRAFADO
                        </p>
                    </div>
                </DialogContent>
            </Dialog>

        </div>
    </section>
  );
}
