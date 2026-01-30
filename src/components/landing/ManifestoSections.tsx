import { GoldHoverText } from "@/components/GoldHoverText";
import { Card } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { LoopVideo } from "@/components/landing/LoopVideo";
import { useRevealOnScroll } from "@/hooks/useRevealOnScroll";
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

function SectionShell(props: { title: string; children: React.ReactNode; id?: string }) {
  const reveal = useRevealOnScroll<HTMLElement>({ rootMargin: "0px 0px -12% 0px", threshold: 0.12, once: true });

  return (
    <section id={props.id} ref={reveal.ref} className={"px-4 py-10 sm:px-6 sm:py-14 " + reveal.className}>
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-6 flex items-end justify-between gap-4">
          <h2 className="text-balance text-2xl font-semibold sm:text-3xl">{props.title}</h2>
        </div>
        <div className="invictus-landing-panel">{props.children}</div>
      </div>
    </section>
  );
}

function BulletList({ items }: { items: readonly string[] }) {
  return (
    <ul className="space-y-2 text-sm text-muted-foreground">
      {items.map((t) => (
        <li key={t} className="flex gap-3">
          <span className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full bg-primary/70" aria-hidden="true" />
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}

export function Manifesto() {
  return (
    <SectionShell title="O que é a Fraternidade Invictus" id="manifesto">
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-5">
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
        </div>

        <div className="space-y-5">
          {/* Vídeo decorativo: reduzido e escondido no mobile para não quebrar layout */}
          <div className="hidden overflow-hidden rounded-xl border border-border/60 bg-background/20 md:block md:max-w-[320px]">
            <AspectRatio ratio={16 / 9}>
              <LoopVideo
                src="/videos/invictus-loop-manifesto-exec.mp4"
                ariaLabel="Vídeo abstrato em loop com estética cinematográfica"
              />
            </AspectRatio>
          </div>
          <h3 className="text-xs font-medium tracking-wide text-muted-foreground">Nossa visão</h3>
          <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
            Criar uma elite capaz de dominar o próprio destino financeiro, operar negócios reais com clareza e estratégia,
            construir patrimônio, legado e liberdade — e viver acima da média, sem depender de ninguém.
          </p>
          <div className="h-px w-full bg-border/60" />
          <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
            A visão é simples e brutalmente honesta: quem entra aqui para crescer, cresce. Quem entra esperando facilidade,
            sai.
          </p>
        </div>
      </div>
    </SectionShell>
  );
}

export function Pillars() {
  const pillars = [
    { title: bullets.pillars[0], Icon: Shield },
    { title: bullets.pillars[1], Icon: Zap },
    { title: bullets.pillars[2], Icon: Target },
    { title: bullets.pillars[3], Icon: Eye },
  ] as const;

  return (
    <SectionShell title="Nossa mentalidade (pilares)">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {pillars.map(({ title, Icon }) => (
          <div key={title} className="rounded-xl border border-border/50 bg-background/25 p-4">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 bg-background/35">
                <Icon className="h-4 w-4 text-primary/80" />
              </span>
              <p className="text-sm font-medium leading-snug">{title}</p>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">Problemas não são pauta. Soluções são obrigação.</p>
          </div>
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
      <div className="grid gap-6 lg:grid-cols-3">
        {groups.map(({ title, Icon, items }) => (
          <div key={title} className="rounded-xl border border-border/50 bg-background/25 p-4">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 bg-background/35">
                <Icon className="h-4 w-4 text-primary/80" />
              </span>
              <p className="text-sm font-medium">{title}</p>
            </div>
            <div className="mt-4 space-y-3">
              {items.map((t) => (
                <div key={t} className="flex gap-3 border-b border-border/60 pb-3 last:border-b-0 last:pb-0">
                  <span className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full bg-primary/70" aria-hidden="true" />
                  <p className="text-sm font-medium leading-snug">{t}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}

export function WhoIsFor() {
  return (
    <SectionShell title="Quem deve (e quem não deve) fazer parte">
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-4">
          <h3 className="text-xs font-medium tracking-wide text-muted-foreground">Você pertence se</h3>
          <BulletList items={bullets.should} />
          <p className="text-sm text-muted-foreground">Não importa de onde você veio. Importa para onde está disposto a ir.</p>
        </div>

        <div className="space-y-4">
          <h3 className="text-xs font-medium tracking-wide text-muted-foreground">Não é para quem</h3>
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
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-4">
          <h3 className="text-xs font-medium tracking-wide text-muted-foreground">Liderança</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            A liderança da INVICTUS não promete. Mostra.
            <br />
            Não motiva. Exige.
            <br />
            Não passa a mão na cabeça. Entrega direção.
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">Aqui você é tratado como adulto. Porque adulto constrói.</p>
        </div>

        <div className="space-y-4">
          <h3 className="text-xs font-medium tracking-wide text-muted-foreground">Regra de permanência</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Só permanece quem prospera. Não por exclusão, mas porque o ritmo elimina quem não acompanha.
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">Resultado é regra. Evolução é obrigação.</p>
        </div>
      </div>
    </SectionShell>
  );
}

export function FinalWarning() {
  return (
    <section className="px-4 pb-12 sm:px-6 sm:pb-16">
      <div className="mx-auto w-full max-w-6xl">
        <Card className="invictus-auth-surface invictus-auth-frame border-0 p-6 sm:p-8">
          <h2 className="text-xl font-semibold">Aviso final</h2>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>Se você chegou até aqui e sentiu desconforto, provavelmente não é para você.</p>
            <p>Se você leu tudo isso e sentiu clareza, bem-vindo ao próximo nível.</p>
            <p className="text-foreground">Isso é INVICTUS. Isso é Fraternidade. Isso é decisão.</p>
          </div>
        </Card>
      </div>
    </section>
  );
}
