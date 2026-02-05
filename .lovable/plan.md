
# Plano: Corrigir Pontuação do Depoimento do Bruno

## Problema Identificado

O depoimento do Bruno contém um **travessão (—)** que causa quebras de linha inadequadas em diferentes viewports, prejudicando a leitura e o alinhamento visual do card.

**Texto atual:**
> "Entrei cético, achando que seria mais um grupo. Me enganei. A disciplina aqui é diferente — quem não acompanha, sai."

O travessão (`—`) força uma quebra visual estranha em certos tamanhos de tela, especialmente quando a largura do card não acomoda bem a frase completa.

## Solução

Substituir o travessão por **vírgula**, mantendo o tom e a fluidez do texto:

**Texto corrigido:**
> "Entrei cético, achando que seria mais um grupo. Me enganei. A disciplina aqui é diferente, quem não acompanha, sai."

## Arquivo a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/components/landing/TestimonialsSection.tsx` | Substituir `—` por `,` no depoimento do Bruno (linha 35) |

## Resultado Esperado

- Texto fluindo naturalmente em todas as larguras de tela
- Quebras de linha mais previsíveis e elegantes
- Consistência com os demais depoimentos que usam vírgulas
