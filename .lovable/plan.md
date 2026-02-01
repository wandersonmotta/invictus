
Objetivo
- Corrigir de forma definitiva o fluxo de “Aprovar” na aba Aprovações:
  - Ao clicar em “Aprovar”, o usuário realmente muda de pending → approved no backend.
  - Ele some imediatamente da fila.
  - O acesso do usuário é liberado “automaticamente” (sem precisar deslogar/logar).
- Evoluir o Admin para:
  - Ter uma aba “Membros” (aprovados) com busca por nome/sobrenome/username e opcionalmente user_id.
  - Na fila de aprovação, permitir “Ver perfil” (preview completo do que a pessoa preencheu) antes de aprovar/recusar.

Diagnóstico (com evidência)
- No banco de teste, os 2 usuários do print continuam como pending (não houve update):
  - Joyce Muniz (user_id b9b11b13-…): access_status = pending
  - Tiago Santos da silva (user_id 2a17baf4-…): access_status = pending
- Hoje o botão “Aprovar” faz um UPDATE direto na tabela profiles pelo frontend:
  - supabase.from("profiles").update({ access_status: "approved", approved_at, approved_by }).eq("id", profileId)
- Esse tipo de update pode falhar por RLS/role/ambiente (principalmente no publicado), e mesmo quando funciona, o usuário “aguardando aprovação” não tem polling — então ele não “libera automaticamente”.

Causas prováveis
1) Atualização de aprovação feita direto na tabela (frontend) é frágil:
   - Depende de RLS estar 100% correto e da sessão do admin estar válida.
   - Se falhar, o usuário não muda para approved e permanece na fila.
2) “Liberação automática” do usuário pendente não existe hoje:
   - RequireAuth consulta access_status uma vez e não faz refetch periódico.
   - Resultado: mesmo que o admin aprove, o usuário pendente pode continuar preso até recarregar/relocar sessão.
3) Observação importante de segurança/estabilidade:
   - Já existe o padrão de “RPC auditada” para leituras admin (admin_list_pending_profiles_logged).
   - Aprovação deve seguir o mesmo padrão: RPC auditada e SECURITY DEFINER, para evitar falhas por RLS na UI e manter auditoria.

Solução proposta (alto nível)
A) Backend (migração)
- Criar 3 funções administrativas auditadas, todas com verificação de admin e log:
  1) admin_get_pending_profile_for_review(p_profile_id uuid)
     - Retorna os campos necessários para revisão:
       - profile.id, user_id, first_name, last_name, display_name, username, avatar_url, bio, city, state, region, expertises, created_at, access_status
     - Motivo: hoje admin não pode “ler profiles livremente” por design (foi removida a policy ampla), então a revisão precisa ser via RPC.
  2) admin_set_profile_status(p_profile_id uuid, p_next access_status)
     - Faz o update de access_status (approved/rejected), seta approved_at/approved_by quando approved, e limpa campos se necessário.
     - Retorna o status final + ids (para UI atualizar corretamente).
     - Loga em admin_audit_logs (ex: action = 'approve_profile' ou 'reject_profile').
  3) admin_search_members(p_search text, p_limit int)
     - Lista apenas aprovados (approved) para a nova aba “Membros”, com filtro por:
       - display_name, first_name, last_name, username (e opcionalmente user_id quando o texto parecer UUID)
     - Retorna campos resumidos para listagem: user_id, profile_id, display_name, username, city, state, approved_at, created_at
- Garantias de segurança:
  - SECURITY DEFINER + SET search_path = public
  - Verificação obrigatória de admin via has_role(auth.uid(), 'admin')
  - Funções que escrevem log precisam ser VOLATILE (seguindo o aprendizado do erro “read-only transaction”).

B) Frontend — Admin UI (src/pages/Admin.tsx)
1) Trocar a ação “Aprovar” para usar RPC admin_set_profile_status
   - Em vez de update direto em profiles.
   - Tratar erro mostrando detalhes mais claros no toast (mensagem + dica de “recarregar e tentar novamente”).
2) Remover o usuário da fila imediatamente (UX):
   - Aplicar otimistic update local (remover item da lista) + invalidate/refetch.
3) Adicionar “Ver perfil” na fila de aprovação
   - Botão “Ver perfil” abre um Dialog:
     - Mostra avatar, nome, @username, cidade/estado, bio, expertises (chips)
     - Mostra também id do usuário (user_id) para auditoria
     - Dentro do Dialog: botões “Aprovar” e “Recusar”
   - Ao abrir o dialog, carregar dados via RPC admin_get_pending_profile_for_review(p_profile_id).
4) Adicionar a nova aba “Membros”
   - Criar um novo TabsTrigger “Membros” (ou “Área de membros”) ao lado de Aprovações.
   - Campo de busca + lista (Table ou Cards) com resultados de admin_search_members.
   - Clique em um membro:
     - Opção 1: botão “Ver perfil público” que abre /membro/:username (removendo @)
     - Opção 2: abrir um dialog com resumo (mesmos campos), e link para perfil público.

C) Frontend — Liberação automática do usuário aprovado (RequireAuth / AguardandoAprovacao)
- Ajustar a lógica para o usuário pendente “se liberar” sozinho após aprovação:
  - Em RequireAuth, quando status !== 'approved', habilitar refetchInterval (ex: 5–10s) enquanto estiver pendente.
  - Alternativamente, aplicar o polling somente quando estiver na rota /aguardando-aprovacao (mais barato).
- Quando detectar que access_status virou 'approved':
  - Redirecionar automaticamente para a rota que o usuário tentou acessar originalmente (state.from) ou /app.

D) Correção de consistência do projeto (importante)
- Foi mencionado em histórico que src/integrations/supabase/types.ts foi editado manualmente; isso é proibido (arquivo gerado).
- Ajuste planejado: reverter qualquer alteração manual nesse arquivo e evitar dependência direta nele para “novas RPCs” até ser regenerado pelo backend automaticamente.

Plano de testes (obrigatório, prático e completo)
1) Teste no ambiente de teste (preview)
- Como admin:
  1. Abrir /admin > Aprovações
  2. Confirmar que Joyce e Tiago aparecem.
  3. Clicar “Ver perfil” em um deles:
     - Confirmar que carrega avatar/bio/expertises/cidade/nome.
  4. Clicar “Aprovar” dentro do dialog:
     - Esperado: toast de sucesso.
     - Esperado: item some da lista sem refresh manual.
     - Validar no backend (consulta) que access_status = approved e approved_at/approved_by preenchidos.
  5. Abrir /admin > Membros:
     - Buscar pelo nome e confirmar que aparece como aprovado.
2) Teste “liberação automática” do usuário
- Em janela anônima:
  1. Logar com um usuário pendente e ficar na tela “Aguardando aprovação”.
  2. Em outra aba, como admin, aprovar esse usuário.
  3. Esperado: a tela do usuário pendente muda sozinha (em até 10s) e libera acesso ao app.
3) Teste no ambiente publicado (produção)
- Após publicar as mudanças:
  - Repetir os mesmos passos acima no site publicado, garantindo que:
    - Aprovação persiste
    - Usuário some da fila
    - Usuário libera automaticamente

Entregáveis
- Migração de backend com as 3 RPCs (review, set status, search members) + auditoria.
- Ajustes em Admin.tsx:
  - Aprovar/Recusar via RPC
  - Dialog “Ver perfil” na fila
  - Aba “Membros” com busca
- Ajuste de polling/refetch para liberação automática em RequireAuth/AguardandoAprovacao.
- Reversão de qualquer edição manual em arquivos gerados (types).

Perguntas rápidas (para eu implementar exatamente como você quer)
1) “Recusar” deve:
   - (A) Apenas marcar access_status = rejected (bloqueado)
   - (B) Marcar rejected e também arquivar/desativar o cadastro (ex: manter registro mas impedir reuso)
2) Na aba “Membros”, você quer ver também:
   - (A) Somente aprovados
   - (B) Filtro por status (approved/pending/rejected) com busca única
(Se você não responder, eu sigo com: Recusar = rejected e aba “Membros” = apenas approved.)