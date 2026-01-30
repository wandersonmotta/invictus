
## O que eu identifiquei no “tablet / outro modelo móvel”
Pelo print em 768x1024 (tablet), o topo fica “apertado” porque:
- A partir de **sm (>= 640px)**, o logo volta para `sm:h-9`, ficando grande e largo (a arte “INVICTUS” ocupa muita largura).
- Nesse tamanho, o “FRATERNIDADE” fica com pouco espaço horizontal (ou fica visualmente esmagado/encoberto pelo conjunto logo + área do usuário).

No mobile (<= 767px) já está OK porque a logo está `h-4`.

Você pediu: **mesma lógica do mobile**, sem alterar o estilo do “FRATERNIDADE” (dourado/efeito/estética), apenas “encaixar” reduzindo a logo e micro-espaçamentos quando necessário.

---

## Objetivo do ajuste (tablet)
- Em tablet: **diminuir a logo o suficiente para caber “FRATERNIDADE” como está**.
- Em desktop: manter como está hoje (logo grande e premium).
- Em mobile: manter como está hoje (logo pequena e tudo encaixado).

---

## Estratégia (mínima e segura)
### 1) Tornar o tamanho da logo “progressivo” por breakpoint (mobile → tablet → desktop)
**Arquivo:** `src/components/AppLayout.tsx`

Hoje:
- `className="h-4 sm:h-9 ..."`

Vamos mudar para 3 níveis:
- **mobile:** `h-4` (mantém o que já resolveu)
- **tablet (sm/md):** reduzir para algo como `sm:h-7` (ou `sm:h-6` se ainda faltar espaço)
- **desktop (lg+):** `lg:h-9` (mantém o desktop intacto)

Exemplo de intenção:
- `className="h-4 sm:h-7 lg:h-9 ..."`

Isso preserva o desktop (só cresce no `lg`) e melhora o tablet, sem tocar no “FRATERNIDADE”.

---

### 2) Ajuste fino de espaçamentos no header especificamente para tablet
**Arquivo:** `src/components/AppLayout.tsx`

Se necessário (dependendo do seu “outro modelo”), vamos “economizar” alguns pixels no tablet, sem mudar design:
- Padding horizontal progressivo:
  - manter `px-2` no mobile
  - usar algo levemente menor no tablet (ex.: `sm:px-3`)
  - manter `lg:px-4` no desktop
- Gap progressivo no agrupamento esquerdo:
  - manter `gap-2` no mobile
  - manter `sm:gap-2` no tablet (em vez de aumentar)
  - usar `lg:gap-3` no desktop

Isso é o mesmo procedimento do mobile: não muda estilo, só “encaixe” por espaço.

---

### 3) Garantir que o “FRATERNIDADE” use o espaço real disponível (sem truncar cedo)
Você já tem:
- Wrapper do texto: `min-w-0 flex-1`
- Texto: `whitespace-nowrap`

Vamos manter isso.
A correção principal no tablet tende a ser **tamanho do logo em sm/md**.

---

## Implementação (passos)
1. Editar `src/components/AppLayout.tsx`:
   - Alterar o `className` do `<img />` para tamanho responsivo em 3 níveis: mobile / tablet / desktop.
   - Ajustar `px` e `gap` com breakpoints, se necessário, para o tablet.
2. Validar em 3 viewports:
   - **Mobile:** 390x844 (já OK, confirmar que não regrediu)
   - **Tablet:** 768x1024 e 820x1180 (onde você relatou o detalhe)
   - **Desktop:** 1366x768 ou 1440x900 (confirmar que ficou igual ao atual)

---

## Critérios de aceite (o que você vai ver)
- Tablet: “FRATERNIDADE” aparece inteiro e alinhado, com o mesmo dourado/efeito, sem esconder.
- Tablet: logo fica proporcional (um pouco menor que desktop, maior que mobile).
- Desktop: topo igual ao que está hoje (visual premium, logo grande).
- Mobile: continua encaixado.

---

## Observação importante (por que não vou mexer no breakpoint “isMobile”)
O `useIsMobile()` considera mobile < 768px. Tablet (768px+) é tratado como desktop pelo layout da sidebar.
Mudar esse breakpoint afetaria o comportamento da navegação (gaveta vs sidebar fixa) e isso é uma mudança maior de UX.
Aqui vamos resolver com o ajuste correto do header (logo/spacing) sem alterar a navegação.

---

## Depois do ajuste
Eu tiro novos prints nas resoluções tablet e te mostro o resultado para confirmar que ficou “encaixado” do jeito certo.
