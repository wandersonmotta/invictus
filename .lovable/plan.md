

# Corrigir chips de prioridade - layout responsivo sem scroll

## Problema
Os chips de filtro (Todos, Urgente, Moderado, Baixo) estao usando `overflow-x-auto` que gera scroll horizontal. O usuario quer que todos aparecam lado a lado, sem scroll, ajustando o tamanho automaticamente.

## Solucao
Trocar o container dos chips para usar `flex` com `flex-1` em cada chip, fazendo com que todos dividam o espaco disponivel igualmente. Remover `overflow-x-auto` e `no-scrollbar`. Reduzir o padding e tamanho do texto nos chips para que caibam confortavelmente em telas pequenas.

## Arquivo modificado
`src/pages/suporte-backoffice/SuporteDashboard.tsx` - componente `PriorityChips`

## Mudancas tecnicas
1. Container: trocar de `flex gap-2 overflow-x-auto no-scrollbar` para `flex gap-1.5 w-full`
2. Cada chip: adicionar `flex-1 justify-center` para distribuir igualmente e centralizar texto
3. Reduzir padding de `px-3 py-1` para `px-1.5 py-1` e texto de `text-xs` para `text-[11px]` para garantir que caiba em telas de 320px
4. Remover `whitespace-nowrap` se existir, para permitir adaptacao natural

