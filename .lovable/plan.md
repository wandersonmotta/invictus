
Objetivo (o que vai mudar)
- Adicionar um campo dedicado `archived_at` (e opcionalmente `archived_by`) na tabela `invite_codes` para diferenciar:
  - “Desativado”: `active = false` e `archived_at IS NULL`
  - “Arquivado”: `archived_at IS NOT NULL` (e, por regra, fica também `active = false`)
- Atualizar a aba Admin → Convites para suportar:
  1) Arquivar individual
  2) Selecionar vários e arquivar
  3) Arquivar todos
- Regras confirmadas por você:
  - Arquivamento é definitivo (não existe “desarquivar” pela UI)
  - Não permitir arquivar convites já usados (`uses_count > 0`)
  - “Ativar/Desativar” continua existindo e não mexe em `archived_at`

O que existe hoje (estado atual)
- Banco: `invite_codes` tem `active`, `uses_count` etc., mas não tem `archived_at`.
- UI: `src/pages/Admin.tsx` lista convites e só tem Ativar/Desativar. Não há seleção/lote.
- Segurança: Admin tem permissão de gerenciar `invite_codes` via policy existente; então a mudança é principalmente de modelagem + UX e (importante) regras de consistência.

Decisões de design (para ficar consistente e “difícil de burlar”)
1) Campos novos no banco
- `invite_codes.archived_at timestamptz NULL`
- `invite_codes.archived_by uuid NULL` (opcional, mas recomendado para rastrear qual admin arquivou)

2) Regras fortes no banco (não só na UI)
Como você pediu “arquivamento definitivo” e “não arquivar usados”, vou aplicar validações no banco para garantir:
- Se tentar setar `archived_at` e `uses_count > 0` → bloqueia.
- Se `archived_at` já estiver preenchido, não pode voltar para NULL (arquivamento definitivo).
- Se `archived_at` estiver preenchido, `active` deve ficar `false` (evita estados inconsistentes).
Implementação dessas regras:
- Preferência por trigger de validação em vez de CHECK complexo. A regra “uses_count > 0” é estável, mas trigger permite mensagens claras e também garante “não desarquivar” de forma robusta.

3) Comportamento do “Desativar”
- Desativar continua sendo apenas `active=false` e NÃO preenche `archived_at`.
- Isso permite que você “pause” um convite sem “sumir” com ele definitivamente (arquivar).

Mudanças no Banco de Dados (migração)
1) Alterar tabela `invite_codes`
- `ALTER TABLE public.invite_codes ADD COLUMN archived_at timestamptz null;`
- `ALTER TABLE public.invite_codes ADD COLUMN archived_by uuid null;`
- Índices:
  - `CREATE INDEX IF NOT EXISTS idx_invite_codes_archived_at ON public.invite_codes(archived_at);`
  - (Opcional) índice composto para listagem: `(archived_at, created_at desc)` se a lista crescer bastante.

2) Trigger/function de validação (regras de negócio)
- Criar `public.invite_codes_validate_archive()` (plpgsql) e um trigger `BEFORE UPDATE` para:
  - Se `NEW.archived_at IS NOT NULL AND OLD.archived_at IS NULL`:
    - Se `OLD.uses_count > 0` ou `NEW.uses_count > 0` → RAISE EXCEPTION (não arquiva usado)
    - Forçar `NEW.active = false`
    - Setar `NEW.archived_by = auth.uid()` se estiver NULL (melhor rastreabilidade)
  - Se `NEW.archived_at IS NULL AND OLD.archived_at IS NOT NULL`:
    - RAISE EXCEPTION (não desarquiva)
  - Se `OLD.archived_at IS NOT NULL`:
    - Se tentarem `NEW.active = true` → RAISE EXCEPTION (arquivado não pode reativar)
Observação: isso vale mesmo para admins; se for necessário “desarquivar” no futuro, a gente cria um RPC específico e controlado (com auditoria), mas por agora você pediu definitivo.

Mudanças na UI (Admin → Convites)
Arquivo alvo: `src/pages/Admin.tsx`

1) Atualizar o query de convites
- Incluir `archived_at, archived_by` no select:
  - `.select("id,code,active,archived_at,archived_by,expires_at,max_uses,uses_count,note,created_at")`

2) Filtros e estados de seleção
- Novo estado: `showArchived` (default false)
  - OFF: lista apenas `archived_at IS NULL` (não arquivados)
  - ON: lista também arquivados
- Seleção:
  - `selectedIds` (Set ou array)
  - Checkbox por linha
  - “Selecionar todos” seleciona somente convites arquiváveis (não usados, não arquivados)

3) Botões e ações (com confirmação)
- Individual:
  - Botão “Arquivar” por convite:
    - Habilitado apenas se `uses_count === 0` e `archived_at IS NULL`
    - Abre AlertDialog confirmando arquivamento definitivo
    - Faz `update({ archived_at: new Date().toISOString() })` (o trigger completa `active=false` e `archived_by`)
- Lote:
  - “Arquivar selecionados”:
    - Atualiza todos os IDs selecionados (que ainda sejam arquiváveis)
  - “Arquivar todos”:
    - Atua sobre todos os convites arquiváveis da lista atual (considerando filtro)
- “Ativar/Desativar”:
  - Continua existindo, mas:
    - Se `archived_at != null`, botão fica desabilitado e mostra “Arquivado”
    - Se `archived_at == null`, opera normalmente como hoje (`active=true/false`)

4) Feedback/UX
- Toasts de sucesso:
  - “Convite arquivado”
  - “X convites arquivados”
- Toast informativo se algum item foi ignorado por regra (ex.: ficou usado enquanto você estava com a tela aberta):
  - “Alguns convites não puderam ser arquivados porque já tiveram uso.”
- Badge/status na lista:
  - “Arquivado” quando `archived_at` preenchido
  - “Inativo” quando `active=false` e `archived_at null`
  - “Ativo” quando `active=true` e `archived_at null`

Sequência de implementação (ordem segura)
1) Criar migração do banco:
   - colunas + índices + trigger de validação
2) Ajustar `src/pages/Admin.tsx`:
   - query passando a trazer os novos campos
   - implementar UI de seleção + botões de arquivar (individual/selecionados/todos)
   - ajustar regras de habilitar/desabilitar botões
3) Testes manuais end-to-end (admin)
4) (Opcional) Rodar um security scan para garantir que não surgiram novas políticas fracas (não deve).

Checklist de teste (end-to-end)
1) Criar convite novo (uses_count = 0)
- Deve aparecer na lista (showArchived OFF)
- Deve permitir “Arquivar”
- Ao arquivar: ele some da lista padrão (porque agora archived_at != null)
- Ao ligar “Mostrar arquivados”: ele aparece com status “Arquivado” e sem permitir reativar

2) Convite usado (uses_count > 0)
- Deve aparecer (se não arquivado)
- Checkbox e botão “Arquivar” devem estar desabilitados
- Se tentar arquivar por algum caminho: o banco deve bloquear (garantia do trigger)

3) Desativar (sem arquivar)
- Clique “Desativar” deve setar apenas `active=false`, mantendo `archived_at null`
- Deve continuar aparecendo na lista padrão (porque não arquivou)

4) Arquivar selecionados / Arquivar todos
- Seleção deve ignorar usados
- Operação em lote deve arquivar apenas os elegíveis, com toast de contagem

Impacto e compatibilidade
- A mudança é retrocompatível: convites antigos ficam com `archived_at = null` e continuam funcionando.
- Nenhuma parte do app fora do Admin depende de `archived_at` para o fluxo de cadastro (o cadastro ainda valida via `active/expires/uses_count` — o que já existe). O Admin será a principal área que passa a usar `archived_at`.

Arquivos que serão alterados (quando você aprovar para eu implementar)
- supabase/migrations/XXXXXXXX_add_invite_archived_at.sql (novo)
- src/pages/Admin.tsx (editar)

Observação importante
- Como o projeto usa tipos gerados do backend, após a migração os tipos serão atualizados automaticamente; eu não vou editar manualmente os arquivos “gerados”.

