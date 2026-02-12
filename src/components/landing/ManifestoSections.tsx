import { GoldHoverText } from "@/components/GoldHoverText";
import { GoldSweepText } from "@/components/landing/GoldSweepText";
import { Card } from "@/components/ui/card";

import { SectionShell } from "@/components/landing/SectionShell";
import { BulletList } from "@/components/landing/BulletList";
import { RevealText } from "@/components/landing/RevealText";
import { useTilt3D } from "@/hooks/useTilt3D";
import { useRevealOnScroll } from "@/hooks/useRevealOnScroll";
import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Eye, Shield, Target, Zap, Layers, Cpu, Briefcase } from "lucide-react";



const bullets = {
  pillars: [
    "Disciplina acima de talento",
    "Execução acima de discurso",
    "Resultado acima de opinião",
    "Verdade acima de ego",
  ],
  findHere: [
    "Estrutura real de crescimento",
    "Tecnologia como base",
    "Inteligência Artificial própria",
    "Ecossistema de negócios",
    "Oportunidades concretas",
    "Pessoas que jogam no modo sério",
  ],
  should: [
    "quer crescer de verdade",
    "aceita ser cobrado",
    "não foge de responsabilidade",
    "entende que evolução dói",
    "quer prosperar e puxar outros junto",
  ],
  shouldNot: [
    "procura atalhos",
    "foge da verdade",
    "vive de desculpa",
    "não executa",
    "se vitimiza",
  ],
} as const;

function TiltCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const tiltRef = useTilt3D<HTMLDivElement>(4);
  return (
    <div ref={tiltRef} className={className}>
      {children}
    </div>
  );
}

export function Manifesto() {
  const containerRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const lineScale = useTransform(scrollYProgress, [0, 0.4], [0, 1]);
  const textY = useTransform(scrollYProgress, [0, 0.5], [50, 0]);
  const opacity = useTransform(scrollYProgress, [0, 0.3], [0, 1]);

  return (
    <section ref={containerRef} className="relative py-24 lg:py-32 overflow-hidden">
      {/* 
        The Vertical Fracture 
        A continuous gold line that severs the content.
        NO CONTAINER. Raw width.
      */}
      <div className="hidden lg:block absolute left-4 lg:left-1/2 top-0 bottom-0 w-[1px] bg-primary/20 z-0">
        <motion.div 
          style={{ scaleY: lineScale }}
          className="absolute top-0 bottom-0 w-full bg-primary origin-top" 
        />
      </div>

      <div className="container px-4 md:px-8 relative z-10 grid lg:grid-cols-2 gap-12 lg:gap-24 items-center">
        {/* Left Side: The Statement */}
        <motion.div style={{ y: textY, opacity }} className="lg:text-right space-y-8">
           <span className="inline-block text-[10px] font-bold uppercase tracking-[0.4em] text-primary/80 border border-primary/20 px-3 py-1 bg-background/50 backdrop-blur-md">
             A Forja
           </span>
           <h2 className="text-5xl sm:text-7xl font-bold tracking-tighter leading-[0.9]">
             FORMANDO<br/>
             <span className="text-primary italic font-serif">INDESTRUTÍVEIS</span>
           </h2>
        </motion.div>

        {/* Right Side: The Breakdown */}
        <div className="space-y-8 lg:pl-12 backdrop-blur-[2px]">
           <RevealText className="max-w-md text-lg leading-relaxed text-muted-foreground/90 font-light text-justify">
             <p>
               A Fraternidade Invictus não é para os que procuram conforto. 
               É para os que entendem que a <span className="font-bold text-foreground bg-primary/10 px-1">maestria</span> é uma disciplina de sangue.
             </p>
             <div className="h-4" />
             <p>
               Nascemos para formar homens e mulheres capazes de dominar o próprio destino.
               Sem desculpas. Sem atalhos. Apenas <span className="italic font-serif text-2xl text-primary">evolução brutal</span>.
             </p>
           </RevealText>
           

        </div>
      </div>
      
      {/* Grain Overlay */}
      <div className="absolute inset-0 z-[1] opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat mix-blend-overlay" />
    </section>
  );
}

export function Pillars() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const x = useTransform(scrollYProgress, [0, 1], ["0%", "-20%"]);

  const pillars = [
    {
      title: bullets.pillars[0],
      Icon: Shield,
      number: "01",
      desc: "Disciplina vence o caos. Rotina, padrão e consistência absoluta quando ninguém está olhando. É a base de todo império.",
    },
    {
      title: bullets.pillars[1],
      Icon: Zap,
      number: "02",
      desc: "Execução é respeito ao tempo. Decidir, fazer, medir e ajustar sem romantizar o processo. O mundo premia quem faz.",
    },
    {
      title: bullets.pillars[2],
      Icon: Target,
      number: "03",
      desc: "Resultado é a única régua. Se não moveu o ponteiro, é ruído. Na Invictus, tudo precisa de evidência concreta.",
    },
    {
      title: bullets.pillars[3],
      Icon: Eye,
      number: "04",
      desc: "Verdade acima do ego. Confronto honesto para evoluir rápido. Corrigir a rota sem desculpas é o segredo da elite.",
    },
  ] as const;

  return (
    <section ref={containerRef} className="py-24 lg:py-32 bg-background relative overflow-hidden">
        <div className="container px-4 md:px-8 mb-16">
            <h2 className="text-4xl sm:text-6xl font-black tracking-tighter uppercase">
                Os Pilares<span className="text-primary">.</span>
            </h2>
        </div>

        {/* 
           LAYOUT SYSTEM UPGRADE:
           - Mobile/Tablet: Horizontal Scroll with SNAP (Premium feel)
           - Desktop: Robust Grid (Authority feel)
        */}
        
        {/* Mobile/Tablet View (Vertical Stack - Requested by User) */}
        <div className="lg:hidden w-full px-4 md:px-8 space-y-8">
             {pillars.map(({ title, Icon, desc, number }, i) => (
                <motion.div 
                    key={title}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ delay: i * 0.1 }}
                    className="group relative bg-card border border-border/50 p-8 overflow-hidden"
                    style={{ borderRadius: 0 }}
                >
                    <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl font-black">{number}</div>
                    
                    <div className="relative z-10">
                        <Icon className="w-10 h-10 text-primary mb-6" strokeWidth={1.5} />
                        <h3 className="text-xl font-bold uppercase tracking-tight mb-4">{title}</h3>
                        <p className="text-muted-foreground text-sm font-light leading-relaxed">
                            {desc}
                        </p>
                    </div>
                </motion.div>
             ))}
        </div>

        {/* Desktop View (Grid) */}
        <div className="hidden lg:grid container px-8 grid-cols-4 gap-6">
            {pillars.map(({ title, Icon, desc, number }, i) => (
                <motion.div 
                    key={title}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="group relative h-[500px] bg-card border border-border/50 hover:border-primary/50 transition-all duration-500 flex flex-col justify-between p-8 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)]"
                    style={{ borderRadius: 0 }}
                >
                    {/* Hover Internal Glow */}
                    <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                    
                    <div className="relative z-10">
                        <span className="text-8xl font-black text-muted-foreground/05 absolute -top-8 -right-8 select-none group-hover:text-primary/10 transition-colors duration-500">
                            {number}
                        </span>
                        <Icon className="w-12 h-12 text-primary mb-8 group-hover:scale-110 transition-transform duration-500" strokeWidth={1} />
                        <h3 className="text-2xl font-bold uppercase tracking-tight mb-6 group-hover:text-primary transition-colors duration-300">{title}</h3>
                        <div className="w-12 h-[1px] bg-primary/50 mb-6 group-hover:w-full transition-all duration-500" />
                        <p className="text-muted-foreground font-light leading-relaxed">
                            {desc}
                        </p>
                    </div>

                    <div className="relative z-10 border-t border-border/30 pt-4 mt-4 flex items-center justify-between opacity-50 group-hover:opacity-100 transition-opacity">
                        <div className="h-1 w-12 bg-primary/20 group-hover:bg-primary transition-all duration-500" />
                        <div className="h-1 w-1 bg-primary/20 group-hover:bg-primary transition-all duration-500 rounded-full" />
                    </div>
                </motion.div>
            ))}
        </div>
    </section>
  );
}

export function WhatYouFindHere() {
  const items = bullets.findHere.map((item, i) => ({
    id: i,
    label: [
        "INFRAESTRUTURA", 
        "TECNOLOGIA", 
        "INTELIGÊNCIA", 
        "NETWORKING", 
        "DEAL FLOW", 
        "CAPITAL HUMANO"
    ][i] || "MÓDULO",
    value: item,
    icon: [Target, Shield, Zap, Layers, Cpu, Briefcase][i] || Target
  }));

  return (
    <section className="relative py-32 bg-black overflow-hidden">
        {/* 
            BACKGROUND IMAGE: High Visibility & Impact
        */}
        <div className="absolute inset-0 z-0">
            <img 
                src="/images/invictus-network-crowd.png" 
                alt="Networking Event" 
                loading="lazy"
                className="w-full h-full object-cover object-center opacity-40 mobile-hero-adjust"
            />
            {/* Elegant Gradient Fade - Bottom Only */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
        </div>

        <div className="container px-6 relative z-10">
            
            {/* BLOCK 1: O AMBIENTE (The Quote) */}
            <div className="max-w-4xl mx-auto text-center mb-24 space-y-6">
                <span className="text-xs font-mono text-primary uppercase tracking-[0.4em] border px-4 py-1 border-primary/30 rounded-full bg-black/50 backdrop-blur-md">
                    O AMBIENTE
                </span>
                
                <h2 className="text-3xl md:text-5xl lg:text-6xl font-serif font-medium text-white leading-tight drop-shadow-2xl">
                    "Você é a média das <span className="text-primary italic">5 pessoas</span><br/> com quem mais convive."
                </h2>
                
                <p className="text-lg text-muted-foreground font-light max-w-2xl mx-auto">
                    Não adianta ter a ferramenta certa no ambiente errado. 
                    Aqui, o ambiente te empurra para cima.
                </p>
            </div>

            {/* BLOCK 2: ARSENAL DO ECOSSISTEMA (The Grid) */}
            <div className="space-y-12">
                <div className="text-center">
                    <h3 className="text-sm font-mono text-white/50 uppercase tracking-[0.2em]">
                        // Arsenal do Ecossistema
                    </h3>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {items.map((item, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="group relative bg-black/40 backdrop-blur-xl border-l-[1px] border-primary/20 hover:border-primary pl-6 py-6 flex flex-col justify-center transition-all duration-500 hover:bg-black/60"
                        >
                            <div className="flex items-center gap-4 mb-3">
                                <item.icon className="w-5 h-5 text-primary/60 group-hover:text-primary transition-colors" strokeWidth={1.5} />
                                <span className="font-mono text-[10px] text-primary/80 uppercase tracking-widest bg-primary/10 px-2 py-0.5 rounded">
                                    {item.label}
                                </span>
                            </div>
                            
                            <h3 className="text-lg md:text-xl font-medium text-white group-hover:translate-x-1 transition-transform duration-300 leading-snug">
                                {item.value}
                            </h3>

                            {/* Subtle Glow on Hover */}
                            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* BLOCK 3: CTA Hint */}
            <div className="mt-24 flex justify-center">
                 <div className="flex items-center gap-2 opacity-60">
                     <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                     <span className="text-[10px] uppercase tracking-widest text-white/50">Rede Ativa Agora</span>
                 </div>
            </div>
        </div>
    </section>
  );
}

export function WhoIsFor() {
  return (
    <section className="py-24 lg:py-32 bg-foreground text-background relative overflow-hidden">
        {/* INVICTUS Background Watermark */}
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none select-none">
            <span className="text-9xl font-black tracking-tighter" style={{ fontFamily: "'Oswald', sans-serif" }}>
                ALVO
            </span>
        </div>

        <div className="container px-4 md:px-8 grid lg:grid-cols-2 gap-12 lg:gap-24">
            {/* Left: The Chosen */}
            <div className="space-y-12">
                <header>
                    <span className="text-xs font-mono text-primary uppercase tracking-widest mb-4 block">
                        // Perfil Aprovado
                    </span>
                    <h3 className="text-4xl md:text-5xl font-bold tracking-tighter mb-6">
                        Você Pertence <span className="text-primary">Se</span>
                    </h3>
                </header>
                
                <ul className="space-y-6">
                    {bullets.should.map((item, i) => (
                        <li key={i} className="flex items-start gap-4 group">
                             <div className="mt-1.5 h-2 w-2 bg-primary rotate-45 group-hover:scale-125 transition-transform" />
                             <p className="text-xl md:text-2xl font-light text-background/90 group-hover:text-primary transition-colors">
                                 {item}
                             </p>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Right: The Rejected (Inverted/Warning feel within the dark section) */}
            <div className="relative p-8 border border-background/20 bg-background/5 backdrop-blur-sm">
                <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-primary" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-primary" />
                
                <header className="mb-10">
                    <span className="text-xs font-mono text-destructive uppercase tracking-widest mb-4 block">
                        // Acesso Negado
                    </span>
                    <h3 className="text-3xl md:text-4xl font-bold tracking-tighter text-muted-foreground/50">
                        Não é para quem
                    </h3>
                </header>

                <ul className="space-y-6 opacity-60 hover:opacity-100 transition-opacity duration-500">
                    {bullets.shouldNot.map((item, i) => (
                        <li key={i} className="flex items-center gap-4">
                             <span className="text-destructive font-mono text-lg">✕</span>
                             <p className="text-lg font-light text-background/60 line-through decoration-destructive/50">
                                 {item}
                             </p>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    </section>
  );
}

export function LeadershipAndRule() {
  return (
    <section className="py-24 lg:py-32 bg-background relative">
        <div className="container px-4 md:px-8 grid lg:grid-cols-2 gap-12 lg:gap-24 items-center">
             {/* Left: Leadership */}
             <div className="space-y-8">
                 <h2 className="text-4xl font-bold tracking-tighter">
                     LIDERANÇA <span className="text-muted-foreground/30">/</span> REAL
                 </h2>
                 <p className="text-lg leading-relaxed text-muted-foreground font-light">
                    A liderança da INVICTUS não promete. <span className="text-foreground font-medium">Mostra.</span><br/>
                    Não motiva. <span className="text-foreground font-medium">Exige.</span><br/>
                    Não passa a mão na cabeça. <span className="text-foreground font-medium">Entrega direção.</span>
                 </p>
                 <div className="h-[1px] w-full bg-border/50" />
                 <p className="text-sm font-mono text-primary/70">
                     Aqui você é tratado como adulto. Porque adulto constrói.
                 </p>
             </div>

             {/* Right: The Rule */}
             <div className="bg-card p-10 border border-border/50 relative">
                 <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-bl-full pointer-events-none" />
                 <h3 className="text-2xl font-bold tracking-tight mb-6 flex items-center gap-3">
                     <Shield className="w-6 h-6 text-primary" />
                     Regra de Permanência
                 </h3>
                 <p className="text-lg leading-relaxed text-muted-foreground font-light">
                    Só permanece quem prospera. Não por exclusão, mas porque o ritmo elimina quem não acompanha.
                 </p>
                 <div className="mt-8 flex items-center gap-4">
                     <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                     <span className="text-xs font-bold uppercase tracking-widest">Evolução é Obrigação</span>
                 </div>
             </div>
        </div>
    </section>
  );
}

export function FinalWarning() {
  const reveal = useRevealOnScroll<HTMLElement>({
    rootMargin: "0px 0px -15% 0px",
    threshold: 0.2,
    once: true,
    enterDelayMs: 60,
    disableClasses: true,
  });

  const scrollToWaitlist = () => {
    document.getElementById("waitlist-section")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section ref={reveal.ref} className="py-32 bg-foreground text-background relative overflow-hidden flex flex-col items-center justify-center text-center px-4">
      {/* The Void */}
      <div className="max-w-2xl space-y-12 relative z-10">
          <motion.div
             initial={{ opacity: 0, scale: 0.8 }}
             whileInView={{ opacity: 1, scale: 1 }}
             viewport={{ once: true }}
             transition={{ duration: 1 }}
          >
              <h2 className="text-base font-mono text-destructive uppercase tracking-[0.3em] mb-4">
                  // Ultimato
              </h2>
              <p className="text-2xl md:text-3xl font-light leading-relaxed">
                  Se você chegou até aqui e sentiu desconforto, <span className="text-muted-foreground/50 decoration-wavy underline">não é para você</span>.
              </p>
              <p className="text-2xl md:text-3xl font-bold text-primary mt-4">
                  Se sentiu clareza, bem-vindo.
              </p>
          </motion.div>

          {/* Functional Red Button */}
          <div className="pt-8 flex flex-col items-center gap-6">
               <button 
                  onClick={scrollToWaitlist}
                  className="group relative inline-flex items-center justify-center w-24 h-24 rounded-full bg-destructive/10 border border-destructive/30 hover:bg-destructive hover:scale-110 transition-all duration-500 cursor-pointer"
                  aria-label="Iniciar Aplicação"
               >
                   <div className="w-16 h-16 rounded-full bg-destructive/20 animate-ping absolute inset-0 m-auto" />
                   <div className="relative z-10 w-8 h-8 bg-destructive rounded-full shadow-[0_0_20px_rgba(255,0,0,0.5)] group-hover:shadow-[0_0_40px_rgba(255,0,0,0.8)] transition-shadow" />
               </button>
               
               <div className="space-y-2">
                   <p className="text-[10px] uppercase tracking-widest opacity-50 font-mono">
                       Iniciar Aplicação
                   </p>
                   <p className="text-[10px] text-destructive/50 font-mono">
                       Acesso ao Protocolo
                   </p>
               </div>
          </div>
      </div>
    </section>
  );
}
