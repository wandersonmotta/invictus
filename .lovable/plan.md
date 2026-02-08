
# Plano: Excluir membros de equipe (Financeiro/Suporte) da listagem de Membros no Admin

## Problema

A funcao RPC `admin_search_members` retorna todos os perfis com `access_status = 'approved'`, sem verificar se o usuario possui uma role restrita (`financeiro` ou `suporte`). Isso faz com que atendentes e membros da equipe financeira aparecam na aba "Membros" do painel admin como se fossem membros regulares da fraternidade.

## Solucao

Atualizar a funcao `admin_search_members` no banco de dados para excluir usuarios que possuam as roles `financeiro` ou `suporte` (exceto se tambem forem admin). Dessa forma, apenas membros reais da fraternidade aparecerao na listagem.

## O que sera feito

### 1. Migration: Atualizar `admin_search_members`

Adicionar um filtro na query que exclui usuarios presentes na tabela `user_roles` com role `financeiro` ou `suporte`:

```text
WHERE p.access_status = 'approved'
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = p.user_id
      AND ur.role IN ('financeiro', 'suporte')
  )
```

Isso garante que:
- Membros regulares continuam aparecendo normalmente
- Admins que tambem sao financeiro/suporte continuam aparecendo (pois o filtro exclui quem tem APENAS essas roles)
- Atendentes e equipe financeira nao aparecem na lista

### 2. Verificar `admin_list_pending_profiles_logged`

Confirmar se a funcao de fila de aprovacao tambem precisa do mesmo filtro (provavelmente nao, pois membros de equipe sao criados com `access_status = 'approved'` e nunca ficam pendentes, mas vale garantir).

## Detalhes Tecnicos

### Arquivo a criar

| Arquivo | Descricao |
|---------|-----------|
| `supabase/migrations/[timestamp].sql` | Migration com `CREATE OR REPLACE FUNCTION admin_search_members` atualizada |

### Nenhum arquivo de codigo frontend precisa ser alterado

A mudanca e inteiramente no banco de dados. O frontend ja chama `admin_search_members` e vai automaticamente parar de exibir esses usuarios.
