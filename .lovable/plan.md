
Objetivo
- Corrigir o modal da publicação que ficou “tomando a tela toda” e/ou desalinhado.
- Deixar o modal com “cara de modal do Instagram”: centralizado, com folga nas bordas, tamanho máximo controlado e sem distorcer o layout mídia + comentários.
- Fazer isso nos dois lugares onde o modal existe:
  - `/membro/:username` (arquivo `src/pages/Membro.tsx`)
  - Preview do perfil (`src/components/profile/MyProfilePreview.tsx`)

Diagnóstico (com base no print + código atual)
- O `DialogContent` (Radix) está dentro de um wrapper fixo: `fixed inset-0 flex items-start justify-center ...` e o próprio conteúdo tem `mt-[10vh] sm:mt-24`.
- Nós forçamos o modal a ter `h-[85vh]` e `w-[min(1100px,...)]`.
  - Em telas menores/médias isso pode ficar grande demais (parece “tela cheia”).
  - A altura fixa grande também dá sensação de “ocupando tudo”, mesmo com overlay.
- Como o wrapper do Dialog usa `items-start`, por padrão ele não fica centralizado verticalmente (fica “mais para cima”), e dependendo do print o usuário interpreta como “não centralizado”.

O que vou ajustar (mudanças pontuais e seguras)
1) Reduzir a largura máxima do modal (desktop)
- Trocar `1100px` por um valor mais próximo do Instagram no desktop (ex.: 935px).
- Manter responsivo: continuar usando `min(..., calc(100vw - ...))` para não estourar em telas menores.

2) Ajustar altura para não parecer “tela cheia”, mantendo o scroll interno funcionando
- Em vez de “empurrar” o modal para quase a tela toda, vou:
  - reduzir a altura fixa (ex.: `h-[min(80vh,720px)]`) ou
  - usar `max-h` + um `h` mais conservador para garantir que:
    - o painel de comentários continue com scroll interno
    - o composer continue visível
    - o modal não pareça ocupar “100%” da tela

3) Centralizar melhor (sem “mudança errada” no layout)
- Como o `DialogContent` fica dentro de um container flex com `items-start`, vou aplicar no `DialogContent`:
  - `self-center` para centralizar no eixo vertical dentro desse wrapper
  - `mt-0` para neutralizar a margem superior padrão do Dialog quando for esse modal específico
- Isso mantém o padrão global de “estabilidade” do projeto, mas permite que esse modal específico fique centralizado como você quer.

4) Garantir que o layout interno (mídia + comentários) não quebre
- Manter:
  - `overflow-hidden p-0` no `DialogContent`
  - `min-h-0` e `h-full` no container interno
- Conferir se o grid `md:grid-cols-[minmax(0,1fr)_420px]` continua correto após ajuste de tamanho.

Arquivos que vou alterar
- `src/pages/Membro.tsx`
  - Ajustar somente a string de classes do `DialogContent`.
- `src/components/profile/MyProfilePreview.tsx`
  - Mesma correção do `DialogContent` para manter consistência.

Exemplo de ajuste (o que muda, conceitualmente)
- Antes (atual):
  - `h-[85vh] w-[min(1100px,calc(100vw-1.5rem))] max-w-none ...`
- Depois (proposto):
  - `h-[min(80vh,720px)] w-[min(935px,calc(100vw-1.5rem))] max-w-none self-center mt-0 ...`
- Observação: posso ajustar finamente os números (935/720/80vh) após ver o resultado no preview.

Como vou validar (com “print” e teste)
1) Abrir `/membro/wandersonmota`
2) Clicar em um post e:
   - conferir se ficou centralizado com folga nas bordas
   - confirmar que não parece “tela cheia”
   - confirmar que a coluna de comentários continua com scroll e o composer aparece
3) Repetir no preview do próprio perfil (aba “Ver como fica” em `/perfil`)
4) Testar responsividade:
   - desktop: lado a lado (mídia esquerda / comentários direita)
   - mobile: empilhado (mídia em cima / comentários embaixo), sem cortar o composer

Possíveis ajustes finos (se necessário após ver no preview)
- Se ainda ficar grande: reduzir para `w-[min(900px,...)]` e/ou `h-[min(75vh,680px)]`
- Se ficar pequeno demais: subir para `w-[min(980px,...)]`
- Se centralizar verticalmente atrapalhar o padrão visual do app: manter `items-start`, mas reduzir apenas tamanho e espaçamentos (sem `self-center`)

Resultado esperado
- Modal realmente “parece modal”: centralizado, com respiro ao redor, não ocupa a tela toda.
- Layout Instagram-style preservado: mídia + painel de comentários + campo de comentar sempre disponível, sem drawer extra.
