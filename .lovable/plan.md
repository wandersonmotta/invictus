

# Plano: Seção de Depoimentos na Landing Page

## Objetivo

Adicionar uma seção de depoimentos/testemunhos logo abaixo da Waitlist, com:
- Fotos de perfil realistas geradas via IA
- Textos persuasivos alinhados com a narrativa da Invictus (disciplina, resultado, transformação)
- Design integrado ao estilo premium existente

## Arquitetura Visual

```text
                    DEPOIMENTOS
┌────────────────────────────────────────────────────────────────────────────┐
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │    [👤]     │  │    [👤]     │  │    [👤]     │  │    [👤]     │       │
│  │  Ricardo M. │  │  Camila S.  │  │  Bruno F.   │  │  Lucas P.   │       │
│  │  "A Invictus│  │ "Nunca mais │  │  "Entrei    │  │ "Fiz 10 mil │       │
│  │   mudou..." │  │  desculpas" │  │   cético..."│  │  em 1 mês"  │       │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘       │
└────────────────────────────────────────────────────────────────────────────┘
```

## Mudanças Técnicas

### 1. Criar componente `TestimonialsSection.tsx`

Novo componente em `src/components/landing/TestimonialsSection.tsx` que:

- Usa `SectionShell` para manter consistência visual
- Exibe 4 depoimentos em grid responsivo (1 coluna mobile, 2 tablet, 4 desktop)
- Cada card de depoimento contém:
  - Avatar circular com foto realista
  - Nome e cargo/área de atuação
  - Texto do depoimento com aspas estilizadas
  - Ícone de aspas decorativo
- Aplica classes `invictus-landing-card invictus-landing-card--lift` para hover premium
- Usa animação stagger `invictus-stagger--lr` para entrada em sequência

**Estrutura do card:**
```text
┌───────────────────────────────────────────┐
│  ❝                                        │
│  "Texto do depoimento que inspira e       │
│   mostra transformação real..."           │
│                                           │
│  ┌────┐                                   │
│  │ 👤 │  Lucas Pereira                    │
│  └────┘  Empreendedor, MG                 │
└───────────────────────────────────────────┘
```

### 2. Gerar fotos de perfil via IA

Utilizar o modelo de geração de imagens para criar 4 fotos de perfil:

- **Estilo**: Retrato profissional, iluminação natural, fundo neutro/escuro
- **Diversidade**: Homens e mulheres, diferentes idades (28-45 anos), brasileiros
- **Formato**: Quadrado, otimizado para avatar circular
- **Qualidade**: Alta resolução, expressão confiante/profissional

As imagens serão salvas em `src/assets/testimonials/` para garantir hashing no build.

### 3. Atualizar `Landing.tsx`

Importar e posicionar `TestimonialsSection` após `WaitlistHero`:

```tsx
<WaitlistHero />
<TestimonialsSection />
<LandingFooter />
```

### 4. Conteúdo dos Depoimentos (4 testemunhos)

Textos alinhados com a narrativa da Invictus:

**Depoimento 1 - Ricardo M., Empresário, SP**
> "A Invictus me tirou da zona de conforto. Em 6 meses, estruturei processos que adiava há anos. Aqui não tem espaço pra desculpa — só pra resultado."

**Depoimento 2 - Camila S., Investidora, RJ**
> "Nunca encontrei um ambiente assim. Pessoas sérias, com mentalidade de crescimento real. A cobrança incomoda, mas é ela que move."

**Depoimento 3 - Bruno F., Consultor, PR**
> "Entrei cético, achando que seria mais um grupo. Me enganei. A disciplina aqui é diferente — quem não acompanha, sai. Simples assim."

**Depoimento 4 - Lucas P., Empreendedor, MG** (NOVO - foco em produtos/serviços e resultado financeiro)
> "Dentro da Invictus encontrei produtos e serviços que mudaram minha vida. Em apenas 1 mês, com disciplina e fazendo o que tinha que ser feito, ganhei mais de R$ 10 mil. Aqui o resultado é questão de tempo pra quem executa."

## Arquivos a Criar/Modificar

| Arquivo | Ação |
|---------|------|
| `src/components/landing/TestimonialsSection.tsx` | Criar |
| `src/assets/testimonials/ricardo.jpg` | Criar (foto gerada via IA) |
| `src/assets/testimonials/camila.jpg` | Criar (foto gerada via IA) |
| `src/assets/testimonials/bruno.jpg` | Criar (foto gerada via IA) |
| `src/assets/testimonials/lucas.jpg` | Criar (foto gerada via IA) |
| `src/pages/Landing.tsx` | Modificar (adicionar import e componente) |

## Considerações de Design

- **Quantidade**: 4 depoimentos (grid 2x2 em tablet, 4 colunas em desktop)
- **Persuasão**: Textos focam em transformação, resultados tangíveis (incluindo financeiro) e a dor de não fazer parte
- **Credibilidade**: Fotos realistas, nomes brasileiros, estados diferentes, cargos que ressoam com o público-alvo
- **Resultado financeiro**: O depoimento do Lucas traz prova social de ganho concreto (R$ 10 mil em 1 mês)
- **Animação**: Cards entram da direita com o mesmo efeito de "encaixe" das outras seções
- **Responsivo**: Stack vertical no mobile, 2x2 em tablet, 4 colunas no desktop

## Fluxo do Usuário

1. Usuário rola página após ler sobre a Invictus
2. Preenche (ou não) a lista de espera
3. Vê depoimentos de pessoas que já fazem parte, incluindo resultados financeiros
4. Sente urgência: "Se ele fez R$ 10 mil em 1 mês, eu também posso"
5. Retorna ao CTA se ainda não preencheu

