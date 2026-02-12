import * as React from "react";
import { Quote, Star, ArrowRight } from "lucide-react";

import { SectionShell } from "./SectionShell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRevealOnScroll } from "@/hooks/useRevealOnScroll";
import { motion, useScroll, useTransform } from "framer-motion";

// Import images (assuming paths are correct)
import ricardoImg from "@/assets/testimonials/ricardo.jpg";
import camilaImg from "@/assets/testimonials/camila.jpg";
import brunoImg from "@/assets/testimonials/bruno.jpg";
import lucasImg from "@/assets/testimonials/lucas.jpg";

const testimonials = [
  {
    name: "Ricardo M.",
    role: "Empresário / SP",
    avatar: ricardoImg,
    initials: "RM",
    quote: "A Invictus me tirou da zona de conforto. Em 6 meses, estruturei processos que adiava há anos. Aqui não tem espaço pra desculpa.",
    result: "R$ 150k+ Faturamento",
    tags: ["Gestão", "Scale-up"]
  },
  {
    name: "Camila S.",
    role: "Investidora / RJ",
    avatar: camilaImg,
    initials: "CS",
    quote: "Nunca encontrei um ambiente assim. Pessoas sérias, com mentalidade de crescimento real. A cobrança incomoda, mas é ela que move.",
    result: "Network High-Level",
    tags: ["Investimentos", "Conexões"]
  },
  {
    name: "Bruno F.",
    role: "Consultor / PR",
    avatar: brunoImg,
    initials: "BF",
    quote: "Entrei cético, achando que seria mais um grupo. Me enganei. A disciplina aqui é diferente, quem não acompanha, sai.",
    result: "Disciplina Militar",
    tags: ["Consultoria", "Foco"]
  },
  {
    name: "Lucas P.",
    role: "Empreendedor / MG",
    avatar: lucasImg,
    initials: "LP",
    quote: "Dentro da Invictus encontrei o que mudou minha vida. Em 1 mês, ganhei mais de R$ 10.000. Disciplina e execução. Aqui o resultado é questão de tempo.",
    result: "R$ 10k+ Mês 1",
    tags: ["Vendas", "Explosão"]
  },
];

export function TestimonialsSection() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, -50]);

  return (
    <section ref={containerRef} className="py-24 lg:py-32 bg-black relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none" />
      <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />

      <div className="container px-4 md:px-8 relative z-10">
        
        {/* Header */}
        <div className="mb-20 text-center space-y-4">
             <span className="inline-block py-1 px-3 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-mono uppercase tracking-widest text-primary mb-4">
                // Prova Real
             </span>
             <h2 className="text-4xl md:text-6xl font-bold tracking-tighter text-white">
                QUEM VIVE A <span className="text-primary italic font-serif">INVICTUS</span>
             </h2>
             <p className="text-muted-foreground max-w-xl mx-auto font-light">
                Histórias reais de quem parou de dar desculpas e começou a dar resultados.
             </p>
        </div>

        {/* Grid System */}
        <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-6 lg:gap-8">
            {testimonials.map((t, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="group relative bg-card/5 border border-white/5 hover:border-primary/30 p-8 transition-all duration-500 hover:bg-card/10 flex flex-col"
                >
                    {/* Corner Accent */}
                    <div className="absolute top-0 right-0 w-12 h-12 overflow-hidden">
                        <div className="absolute top-0 right-0 w-2 h-2 bg-primary/20 group-hover:bg-primary transition-colors" />
                        <div className="absolute bottom-0 left-0 w-[1px] h-[150%] bg-gradient-to-t from-transparent to-primary/20 -rotate-45 transform origin-bottom-left" />
                    </div>

                    {/* Header: User Info */}
                    <div className="flex items-center gap-4 mb-6">
                        <Avatar className="w-14 h-14 ring-2 ring-white/10 group-hover:ring-primary/50 transition-all">
                            <AvatarImage src={t.avatar} alt={t.name} className="object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                            <AvatarFallback className="bg-primary/5 text-primary">{t.initials}</AvatarFallback>
                        </Avatar>
                        <div>
                            <h4 className="text-lg font-bold text-white group-hover:text-primary transition-colors">
                                {t.name}
                            </h4>
                            <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                                {t.role}
                            </span>
                        </div>
                    </div>

                    {/* Quote */}
                    <div className="relative mb-8 flex-1">
                        <Quote className="absolute -top-4 left-4 w-8 h-8 text-primary/10 group-hover:text-primary/20 transition-colors rotate-180" />
                        <p className="text-muted-foreground/90 font-light leading-relaxed relative z-10 pl-14 border-l-2 border-primary/10 group-hover:border-primary/50 transition-colors">
                            "{t.quote}"
                        </p>
                    </div>

                    {/* Result Tag (The "Evolution") */}
                    <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                             <div className="p-1.5 rounded-full bg-primary/10 text-primary">
                                 <Star className="w-3 h-3 fill-current" />
                             </div>
                             <span className="text-xs font-bold uppercase tracking-wider text-white/80">
                                 {t.result}
                             </span>
                        </div>
                        
                        {/* Tags */}
                        <div className="flex gap-2">
                            {t.tags.map(tag => (
                                <span key={tag} className="text-[9px] uppercase tracking-widest text-muted-foreground/50 border border-white/5 px-2 py-1 rounded">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>

        {/* CTA Connection */}
        <div className="mt-16 text-center">
            <a href="#waitlist-section" className="inline-flex items-center gap-2 text-sm font-mono text-primary/60 hover:text-primary uppercase tracking-[0.2em] transition-colors group cursor-pointer">
                Ver mais histórias no protocolo
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
        </div>
      </div>
    </section>
  );
}
