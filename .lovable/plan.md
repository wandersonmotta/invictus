

## Melhoria da Página de Busca - Estilo Instagram

### Objetivo
Transformar a busca para funcionar como o Instagram:
- Buscar por **nome** (ex: "Thiago Silva") OU por **@username**
- Retornar **múltiplos resultados** (lista)
- Exibir cada resultado como: foto circular + nome + @arroba

---

### Mudanças Planejadas

#### 1. Nova função SQL: `search_members`

Criar uma função de busca mais flexível que:
- Busca por nome (display_name) OU username
- Retorna múltiplos resultados (até 30)
- Exclui perfis sem nome/username válidos (sem "Membro fantasma")
- Respeita visibilidade do perfil (members/mutuals)

```text
search_members(p_search text, p_limit int DEFAULT 30)
→ user_id, display_name, username, avatar_url
```

A busca vai funcionar assim:
- "Thiago" → encontra todos com "Thiago" no nome
- "Thiago Silva" → encontra todos com "Thiago Silva" no nome
- "@thiago" → encontra todos com @thiago... no username

#### 2. Atualizar a página `/buscar` (Buscar.tsx)

**Layout atual:**
- Input de busca + botão "Buscar"
- Exibe UM resultado detalhado (foto, nome, @, cidade, botões de ação)

**Novo layout (estilo Instagram):**

```text
┌─────────────────────────────────────────┐
│ 🔍 Buscar                               │
│ Encontre membros pelo nome ou @         │
├─────────────────────────────────────────┤
│ [________________] [Buscar] [Limpar]    │
│  "Thiago Silva"                         │
├─────────────────────────────────────────┤
│  ┌────┐                                 │
│  │ 😊 │  Thiago Silva                   │
│  └────┘  @thiago.silva                  │
│  ─────────────────────────────────────  │
│  ┌────┐                                 │
│  │ 😊 │  Thiago Oliveira                │
│  └────┘  @thiago.oliveira               │
│  ─────────────────────────────────────  │
│  ┌────┐                                 │
│  │ 😊 │  Thiago Santos                  │
│  └────┘  @thiago.santos                 │
└─────────────────────────────────────────┘
```

**Comportamento:**
- Ao digitar e clicar "Buscar", exibe lista de resultados
- Cada item é clicável → navega para `/membro/:username`
- Sem botões inline (Seguir, Mensagem) na lista — isso fica no perfil
- Lista com scroll se houver muitos resultados (max-height)

**Alternativa de UX** (mais fluida):
- Busca "live" conforme digita (com debounce de 300ms)
- Sem botão "Buscar" explícito
- Similar ao Instagram onde os resultados aparecem enquanto você digita

---

### Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| Nova migration SQL | Criar função `search_members` |
| `src/pages/Buscar.tsx` | Refatorar para lista de resultados estilo Instagram |

---

### Detalhes Técnicos

#### Função SQL `search_members`

```sql
CREATE OR REPLACE FUNCTION public.search_members(
  p_search text DEFAULT ''::text,
  p_limit integer DEFAULT 30
)
RETURNS TABLE(
  user_id uuid,
  display_name text,
  username text,
  avatar_url text
)
-- Busca por display_name OU username
-- Respeita profile_visibility
-- Exclui perfis sem nome/username
```

#### Componente de Item de Resultado

```tsx
// Cada resultado na lista
<button
  onClick={() => navigate(`/membro/${username.replace(/^@/, "")}`)}
  className="flex w-full items-center gap-3 p-3 hover:bg-muted/20"
>
  <img src={avatar_url} className="h-12 w-12 rounded-full" />
  <div>
    <div className="font-medium">{display_name}</div>
    <div className="text-muted-foreground text-sm">{username}</div>
  </div>
</button>
```

---

### Resumo Visual

| Estado | Exibição |
|--------|----------|
| Inicial | "Digite um nome ou @ para buscar" |
| Digitando/Buscando | "Buscando…" |
| Com resultados | Lista de perfis (foto + nome + @) |
| Sem resultados | "Nenhum membro encontrado" |
| Erro | "Não foi possível buscar" |

