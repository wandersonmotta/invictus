 import * as React from "react";
 import { Quote } from "lucide-react";
 
 import { SectionShell } from "./SectionShell";
 import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
 
 import ricardoImg from "@/assets/testimonials/ricardo.jpg";
 import camilaImg from "@/assets/testimonials/camila.jpg";
 import brunoImg from "@/assets/testimonials/bruno.jpg";
 import lucasImg from "@/assets/testimonials/lucas.jpg";
 
 const testimonials = [
   {
    name: "Ricardo M.",
     role: "Empresário, SP",
     avatar: ricardoImg,
     initials: "RM",
     quote:
      "A Invictus me tirou da zona de conforto. Em 6 meses, estruturei processos que adiava há anos. Aqui não tem espaço pra desculpa.",
   },
   {
    name: "Camila S.",
     role: "Investidora, RJ",
     avatar: camilaImg,
     initials: "CS",
     quote:
      "Nunca encontrei um ambiente assim. Pessoas sérias, com mentalidade de crescimento real. A cobrança incomoda, mas é ela que move.",
   },
   {
    name: "Bruno F.",
     role: "Consultor, PR",
     avatar: brunoImg,
     initials: "BF",
     quote:
      "Entrei cético, achando que seria mais um grupo. Me enganei. A disciplina aqui é diferente — quem não acompanha, sai.",
   },
   {
    name: "Lucas P.",
     role: "Empreendedor, MG",
     avatar: lucasImg,
     initials: "LP",
     quote:
      "Dentro da Invictus encontrei o que mudou minha vida. Em 1 mês, ganhei mais de R$ 10 mil. Disciplina e execução. Aqui o resultado é questão de tempo.",
   },
 ];
 
 export function TestimonialsSection() {
   return (
     <SectionShell id="depoimentos" title="Quem Vive a Invictus">
      <div className="invictus-stagger--lr grid gap-3 sm:gap-4 lg:gap-5 md:auto-rows-fr md:grid-cols-2 xl:grid-cols-4">
         {testimonials.map((t, i) => (
           <article
             key={t.name}
            className="invictus-landing-card invictus-landing-card--lift group relative flex h-full flex-col justify-between gap-3 p-4 sm:gap-4 sm:p-5 lg:p-6"
             style={{ "--stagger-index": i } as React.CSSProperties}
           >
             {/* Quote icon */}
             <Quote
               className="absolute right-4 top-4 size-6 text-primary/30 transition-colors group-hover:text-primary/50"
               aria-hidden="true"
             />
 
             {/* Quote text */}
            <blockquote className="text-sm leading-relaxed text-muted-foreground sm:text-base">
               "{t.quote}"
             </blockquote>
 
             {/* Author */}
            <footer className="mt-auto flex items-center gap-3 border-t border-border/40 pt-3 sm:pt-4">
               <Avatar className="size-10 ring-2 ring-primary/20">
                 <AvatarImage src={t.avatar} alt={t.name} />
                 <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
                   {t.initials}
                 </AvatarFallback>
               </Avatar>
               <div className="min-w-0">
                 <p className="truncate text-sm font-semibold text-foreground">{t.name}</p>
                 <p className="truncate text-xs text-muted-foreground">{t.role}</p>
               </div>
             </footer>
           </article>
         ))}
       </div>
     </SectionShell>
   );
 }