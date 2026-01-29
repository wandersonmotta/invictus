
Objetivo
- Reproduzir e corrigir o bug do modal “Tenho um convite” na autenticação, onde o formulário “anda” (muda de posição) enquanto o usuário digita/abre/fecha o modal.
- Eliminar também o warning do console sobre “Function components cannot be given refs… DialogFooter”, que pode estar contribuindo para comportamento estranho do Dialog (foco/medidas).

O que eu identifiquei até agora (com base no código e no teste)
1) O Dialog atual (src/components/ui/dialog.tsx) usa o padrão “centrado por transform”:
   - `position: fixed; left: 50%; top: 50%; transform: translate(-50%, -50%)`
   - Isso faz o modal ficar sempre centralizado, mas tem um efeito colateral: se a altura do conteúdo muda (ex.: mensagens de erro surgem/desaparecem, teclado virtual em mobile, autofill, mudança de fonte, etc.), a posição recalcula e o modal “anda” para manter o centro.
2) Em páginas com conteúdo centralizado (como /auth), abrir um modal frequentemente mexe no scrollbar do body (travamento de scroll). Se o navegador remove/adiciona a barra de rolagem, a largura útil da página muda e dá “pulo” horizontal perceptível (parece que tudo “caminha”).
3) O console mostra warning específico envolvendo `DialogFooter`:
   - Isso indica que algum componente está recebendo `ref` indevidamente (ou o Radix está tentando focar/medir algo e encontra um componente que não suporta ref).
   - Mesmo que não seja a causa principal do “andar”, vale corrigir para estabilizar o comportamento do Dialog.

Hipóteses mais prováveis para o “form andando”
A) Reposicionamento por mudança de altura do conteúdo do modal
- Qualquer variação de altura (erro de validação, layout reflow, font fallback, etc.) desloca o modal porque ele está preso ao “centro” via translate.
B) “Layout shift” por barra de rolagem (scrollbar) ao abrir/fechar o Dialog
- Quando o scroll do body é bloqueado, a scrollbar some e o layout muda alguns pixels.
- Isso pode dar sensação de “andar” mesmo sem alterar o modal.

Solução proposta (o que será implementado)
Parte 1 — Tornar o Dialog “estável” na tela (sem “andar” com a altura)
- Ajustar o layout do Dialog em `src/components/ui/dialog.tsx` para não depender de `translateY(-50%)` do conteúdo.
- Trocar para um container “fixed inset-0 flex” no Portal, e posicionar o Content com margem/topo fixo:
  - Portal wrapper: `fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6`
  - Content: `w-full max-w-lg` com `mt-[10vh]` (ou `mt-16 sm:mt-24`) e `max-h-[calc(100vh-…)] overflow-y-auto`
- Resultado: o modal não recalcula a posição vertical quando o conteúdo muda; ele só cresce para baixo e, se precisar, ganha scroll interno.

Parte 2 — Evitar “pulo” horizontal ao abrir/fechar o modal (scrollbar-gutter)
- Adicionar CSS global (em `src/index.css`) para manter o espaço da scrollbar estável:
  - Preferência moderna: `html { scrollbar-gutter: stable; }`
  - Fallback se necessário: `html { overflow-y: scroll; }` (força scrollbar sempre presente)
- Resultado: abrir o Dialog não altera a largura útil da página, reduzindo o “andar” lateral do conteúdo.

Parte 3 — Corrigir o warning de ref no DialogFooter (estabilidade do Radix)
- Em `src/components/ui/dialog.tsx`, mudar `DialogFooter` para `React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>` (mesmo padrão de outros componentes).
- Isso elimina o warning e garante compatibilidade com qualquer mecanismo interno que tente passar ref para o footer (direta ou indiretamente via composição).

Parte 4 — Verificação prática do bug (antes/depois)
- Reproduzir no preview:
  1) Abrir /auth
  2) Clicar “Tenho um convite”
  3) Digitar nos campos, alternar foco, e causar erros (ex.: submeter com invite curto) para ver se há variação de altura
  4) Confirmar que o modal permanece estável (não “anda”).
- Testar também:
  - Mobile (teclado virtual costuma piorar reposicionamento)
  - Chrome e Safari (Safari é mais sensível a viewport/keyboard)

Arquivos que serão alterados
- src/components/ui/dialog.tsx
  - Refactor do posicionamento do DialogContent (container flex + scroll interno)
  - DialogFooter com forwardRef
- src/index.css
  - `scrollbar-gutter: stable` (e fallback se necessário)

Riscos e cuidados
- Garantir que o “glass” continue intacto (as classes existentes `invictus-auth-surface invictus-auth-frame` continuam no Content).
- Garantir z-index alto (já existe z-50) e overlay cobrindo tudo.
- Garantir acessibilidade/foco: Radix continuará gerenciando foco; o ref warning removido ajuda.

Critério de aceite (o que você deve perceber)
- Ao abrir o modal e digitar, o modal não “caminha” para cima/baixo (mesmo com mensagens de erro).
- Ao abrir/fechar, o fundo não dá “pulo” lateral por causa da scrollbar.
- O warning “Function components cannot be given refs… DialogFooter” some do console.
