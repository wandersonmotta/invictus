
Objetivo
- No desktop (computador/notebook), a página /reconhecimento deve caber 100% na altura visível, sem rolagem vertical, mantendo o tamanho/visual original dos cards (sem “compactar” o card).
- A rolagem deve existir apenas na horizontal (carrossel de premiações).

Diagnóstico (pelo código atual + seu print)
- O scroll vertical está vindo do container principal do layout (`AppLayout`), que sempre usa `overflow-y-auto` no “Main content area”.
- Mesmo com o `Reconhecimento` tentando ocupar `h-full` e usando `flex-1 min-h-0`, a combinação de:
  - padding vertical do conteúdo (`p-4 sm:p-5 lg:p-6`)
  - gaps/space-y do header/section
  - `pb-3` no carrossel
  pode causar alguns pixels de overflow vertical. Como o pai é `overflow-y-auto`, você consegue “descer” para ver a parte de baixo.

Estratégia de correção (sem mexer no tamanho do card)
1) Tornar o “Main content area” do `AppLayout` configurável por rota
- Usar `useLocation()` dentro de `AppLayout` para detectar `pathname === "/reconhecimento"` (desktop).
- Para essa rota especificamente:
  - Trocar `overflow-y-auto` por `overflow-y-hidden` (no desktop) para impedir qualquer rolagem vertical.
  - Ajustar o padding do container apenas o necessário (normalmente reduzir um pouco o padding vertical) para garantir que o conteúdo caiba sem cortar nada.
  - Manter o comportamento atual de mobile/tablet (continua com `overflow-y-auto` + `pb-24` por causa do bottom nav).

2) Ajuste fino no `Reconhecimento.tsx` (desktop) só para eliminar micro-overflow
Sem alterar o card:
- Remover o `pb-3` do container do carrossel (isso frequentemente cria “sobrinha” vertical desnecessária).
- Garantir que o container do carrossel não crie altura extra:
  - Manter `flex-1 min-h-0 overflow-hidden` no wrapper (já está ok).
  - Manter `h-full` no `overflow-x-auto` (já está ok).
- Se ainda sobrar 1–8px de overflow por conta de gaps/space-y, reduzir apenas espaçamentos verticais no desktop (sem tocar no card):
  - `gap-6` -> `gap-4` somente no desktop
  - `section space-y-4` -> `space-y-3` somente no desktop
  - `header space-y-1` pode virar `space-y-0.5` somente no desktop
Esses ajustes preservam o “tamanho do card” e só refinam o ritmo vertical para caber na dobra.

3) Critério de sucesso (o que vou validar no teste)
- Desktop:
  - Não deve existir scroll vertical no conteúdo da página (trackpad/mouse wheel não move para baixo).
  - Todo o conteúdo (títulos + cards completos com nome/descrição/badge) deve estar visível sem precisar rolar.
  - O carrossel continua com scroll horizontal funcionando e com snap.
- Mobile/Tablet:
  - Continua tendo scroll vertical natural e `pb-24` para não ficar atrás do bottom nav.

4) Teste prático (automatizado + visual) que vou executar ao implementar
- Abrir /reconhecimento em viewport desktop e validar:
  - `mainContent.scrollHeight === mainContent.clientHeight` (ou diferença 0/1px) e que o wheel não desloca verticalmente.
- Validar em viewport menor de notebook (ex.: 1366x768) e maior (1920x1080).
- Validar rapidamente mobile (390x844) para garantir que não quebrou o padding do bottom nav nem a pilha vertical.

Arquivos que serão alterados
- `src/components/AppLayout.tsx`
  - Adicionar `useLocation()`
  - Aplicar classes condicionais por rota (/reconhecimento) e por breakpoint (desktop vs mobile/tablet)
- `src/pages/Reconhecimento.tsx`
  - Remover `pb-3` do carrossel desktop
  - (Se necessário) reduzir somente espaçamentos verticais no desktop para eliminar overflow residual

Riscos / Observações
- Se a altura da tela for muito baixa (ex.: janelas pequenas), qualquer layout pode precisar de scroll. A correção vai focar em “desktop normal” (notebook/monitor) e remover o overflow que hoje aparece mesmo com espaço suficiente.
- Vou evitar qualquer mudança em `RecognitionCard.tsx` para garantir “tamanho original do card”.

Sequência de implementação
1) Ajustar `AppLayout.tsx` para suportar modo “sem scroll vertical” especificamente em /reconhecimento no desktop.
2) Ajustar `Reconhecimento.tsx` (remover `pb-3` e, se necessário, pequenos ajustes em gap/space-y só no desktop).
3) Rodar testes visuais nos breakpoints e confirmar que a rolagem vertical sumiu sem cortar conteúdo.
