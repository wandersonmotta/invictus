import { GoldHoverText } from "@/components/GoldHoverText";
import { GoldSweepText } from "@/components/landing/GoldSweepText";
import { Card } from "@/components/ui/card";
import { EditorialMedia } from "@/components/landing/EditorialMedia";
import { SectionShell } from "@/components/landing/SectionShell";
import { BulletList } from "@/components/landing/BulletList";
import { RevealText } from "@/components/landing/RevealText";
import { useTilt3D } from "@/hooks/useTilt3D";
import { useRevealOnScroll } from "@/hooks/useRevealOnScroll";
import { Eye, Shield, Target, Zap, Layers, Cpu, Briefcase } from "lucide-react";

import manifestoMedia from "@/assets/invictus-landing-manifesto-media-color.jpg";

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
  return (
    <SectionShell title="O que é a Fraternidade Invictus" id="manifesto">
      <div className="invictus-stagger grid gap-8 lg:grid-cols-2">
        <RevealText className="invictus-stagger space-y-5">
          <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
            A Fraternidade Invictus nasce para formar homens e mulheres indestrutíveis — mentalidade de liderança,
            disciplina inegociável e obsessão por resultado.
          </p>
          <div className="h-px w-full bg-border/60" />
          <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
            Aqui não existe promessa fácil. Existe processo, verdade e consequência.
          </p>
          <p className="text-pretty text-sm leading-relaxed">
            <GoldHoverText>INVICTUS não é sobre motivação.</GoldHoverText> É sobre transformação real.
          </p>
        </RevealText>

        <div className="invictus-stagger space-y-5">
          <EditorialMedia
            src={manifestoMedia}
            className="sm:max-w-[420px]"
            loading="eager"
          />
          <h3 className="invictus-subtitle">Nossa visão</h3>
          <RevealText className="space-y-4">
            <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
              Criar uma elite capaz de dominar o próprio destino financeiro, operar negócios reais com clareza e estratégia,
              construir patrimônio, legado e liberdade — e viver acima da média, sem depender de ninguém.
            </p>
            <div className="h-px w-full bg-border/60" />
            <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
              A visão é simples e brutalmente honesta: quem entra aqui para crescer, cresce. Quem entra esperando facilidade,
              sai.
            </p>
          </RevealText>
        </div>
      </div>
    </SectionShell>
  );
}

export function Pillars() {
  const pillars = [
    {
      title: bullets.pillars[0],
      Icon: Shield,
      desc: "Disciplina vence o caos: rotina, padrão e consistência quando ninguém está olhando.",
    },
    {
      title: bullets.pillars[1],
      Icon: Zap,
      desc: "Execução é respeito ao tempo: decidir, fazer, medir e ajustar sem romantizar o processo.",
    },
    {
      title: bullets.pillars[2],
      Icon: Target,
      desc: "Resultado é a régua: se não moveu o ponteiro, é barulho. Tudo precisa de evidência.",
    },
    {
      title: bullets.pillars[3],
      Icon: Eye,
      desc: "Verdade acima do ego: confronto honesto para evoluir rápido e corrigir rota sem desculpa.",
    },
  ] as const;

  return (
    <SectionShell title="Nossa mentalidade (pilares)">
      <div className="invictus-stagger invictus-stagger--lr grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {pillars.map(({ title, Icon, desc }) => (
          <TiltCard key={title} className="invictus-landing-card invictus-landing-card--lift p-4">
            <div className="flex items-center gap-2">
              <span className="invictus-icon-plate inline-flex h-8 w-8 items-center justify-center" aria-hidden="true">
                <Icon className="h-4 w-4 text-primary/85" />
              </span>
              <p className="text-sm font-medium leading-snug">{title}</p>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{desc}</p>
          </TiltCard>
        ))}
      </div>
    </SectionShell>
  );
}

export function WhatYouFindHere() {
  const groups = [
    { title: "Estrutura e processo", Icon: Layers, items: bullets.findHere.slice(0, 2) },
    { title: "Tecnologia e IA", Icon: Cpu, items: bullets.findHere.slice(2, 4) },
    { title: "Ecossistema", Icon: Briefcase, items: bullets.findHere.slice(4, 6) },
  ] as const;

  return (
    <SectionShell title="O que você encontra aqui">
      <div className="invictus-stagger invictus-stagger--lr grid gap-6 lg:grid-cols-3">
        {groups.map(({ title, Icon, items }) => (
          <TiltCard key={title} className="invictus-landing-card invictus-landing-card--lift p-4">
            <div className="flex items-center gap-2">
              <span className="invictus-icon-plate inline-flex h-8 w-8 items-center justify-center" aria-hidden="true">
                <Icon className="h-4 w-4 text-primary/85" />
              </span>
              <p className="text-sm font-medium">{title}</p>
            </div>
            <div className="invictus-stagger mt-4 space-y-3">
              {items.map((t) => (
                <div key={t} className="flex gap-3 border-b border-border/60 pb-3 last:border-b-0 last:pb-0">
                  <span className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full bg-primary/70" aria-hidden="true" />
                  <p className="text-sm font-medium leading-snug">{t}</p>
                </div>
              ))}
            </div>
          </TiltCard>
        ))}
      </div>
    </SectionShell>
  );
}

export function WhoIsFor() {
  return (
    <SectionShell title="Quem deve (e quem não deve) fazer parte">
      <div className="invictus-stagger grid gap-8 lg:grid-cols-2">
        <div className="space-y-4">
          <h3 className="invictus-subtitle">Você pertence se</h3>
          <BulletList items={bullets.should} />
          <p className="text-sm text-muted-foreground">Não importa de onde você veio. Importa para onde está disposto a ir.</p>
        </div>

        <div className="space-y-4">
          <h3 className="invictus-subtitle">Não é para quem</h3>
          <BulletList items={bullets.shouldNot} />
          <p className="text-sm text-muted-foreground">Aqui ninguém é carregado. Cada um sustenta o próprio lugar.</p>
        </div>
      </div>
    </SectionShell>
  );
}

export function LeadershipAndRule() {
  return (
    <SectionShell title="Liderança e regra de permanência">
      <div className="invictus-stagger grid gap-8 lg:grid-cols-2">
        <RevealText className="space-y-4">
          <h3 className="invictus-subtitle">Liderança</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            A liderança da INVICTUS não promete. Mostra.
            <br />
            Não motiva. Exige.
            <br />
            Não passa a mão na cabeça. Entrega direção.
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">Aqui você é tratado como adulto. Porque adulto constrói.</p>
        </RevealText>

        <RevealText className="space-y-4">
          <h3 className="invictus-subtitle">Regra de permanência</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Só permanece quem prospera. Não por exclusão, mas porque o ritmo elimina quem não acompanha.
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">Resultado é regra. Evolução é obrigação.</p>
        </RevealText>
      </div>
    </SectionShell>
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

  const goldLineStyle: React.CSSProperties = {
    height: 1,
    background: "linear-gradient(90deg, transparent 0%, hsl(var(--gold-hot) / 0.6) 30%, hsl(var(--gold-hot) / 0.9) 50%, hsl(var(--gold-hot) / 0.6) 70%, transparent 100%)",
    transform: reveal.visible ? "scaleX(1)" : "scaleX(0)",
    transition: "transform 900ms cubic-bezier(0.2,0.8,0.2,1)",
  };

  const titleGradient: React.CSSProperties = {
    backgroundImage: "linear-gradient(135deg, hsl(var(--gold-hot)) 0%, hsl(var(--gold-soft)) 50%, hsl(var(--gold-hot)) 100%)",
    backgroundClip: "text",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  };

  return (
    <section ref={reveal.ref} className="px-4 pb-12 sm:px-6 sm:pb-16">
      <div
        className="mx-auto w-full max-w-6xl space-y-4"
        style={{
          opacity: reveal.visible ? 1 : 0,
          transform: reveal.visible ? "none" : "translateY(16px)",
          transition: "opacity 700ms cubic-bezier(0.2,0.8,0.2,1), transform 700ms cubic-bezier(0.2,0.8,0.2,1)",
        }}
      >
        {/* Linha dourada superior */}
        <div style={goldLineStyle} aria-hidden="true" />

        <Card className="invictus-auth-surface invictus-auth-frame border-0 p-8 sm:p-10 lg:p-12">
          {/* Eyebrow */}
          <span
            className="mb-4 inline-block text-[10px] font-semibold uppercase tracking-[0.25em]"
            style={{ color: "hsl(var(--gold-hot))" }}
          >
            INVICTUS
          </span>

          {/* Título dourado */}
          <h2 className="text-2xl font-semibold tracking-wide sm:text-3xl" style={titleGradient}>
            Aviso final
          </h2>

          <RevealText className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
            <p>Se você chegou até aqui e sentiu desconforto, provavelmente não é para você.</p>
            <p>Se você leu tudo isso e sentiu clareza, bem-vindo ao próximo nível.</p>
            <p className="text-foreground font-medium">
              <GoldSweepText>Isso é INVICTUS. Isso é Fraternidade. Isso é decisão.</GoldSweepText>
            </p>
          </RevealText>
        </Card>

        {/* Linha dourada inferior */}
        <div style={{ ...goldLineStyle, transitionDelay: "200ms" }} aria-hidden="true" />
      </div>
    </section>
  );
}
