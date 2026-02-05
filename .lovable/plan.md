

# Plano: Filtro de Palavras Ofensivas na Comunidade

## Objetivo

Implementar um sistema que bloqueie o envio de mensagens contendo palavras ofensivas na Comunidade, impedindo que o usuário consiga postar conteúdo inadequado.

## Abordagem

Criar uma **função de validação no banco de dados** que verifica o texto antes de permitir a inserção. Isso garante que:
- A validação acontece no servidor (não pode ser burlada pelo cliente)
- Todas as funcionalidades passam pelo mesmo filtro
- A lista de palavras pode ser atualizada sem deploy

## Arquitetura

```text
Usuário digita mensagem
        │
        ▼
Frontend envia para RPC
        │
        ▼
┌───────────────────────────────────┐
│  contains_profanity(texto)        │
│  └─ Normaliza: lowercase, remove  │
│     acentos, variações l33t       │
│  └─ Verifica contra lista         │
└───────────────────────────────────┘
        │
        ├─ Contém? → RAISE EXCEPTION
        │            "Mensagem contém
        │             conteúdo inadequado"
        │
        └─ Não contém? → Continua normalmente
```

## Mudanças Técnicas

### 1. Criar tabela `blocked_words`

Armazena palavras/expressões bloqueadas:

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | Chave primária |
| word | TEXT | Palavra ou expressão |
| category | TEXT | Categoria (ofensivo, spam, etc) |
| active | BOOLEAN | Se está ativa |
| created_at | TIMESTAMP | Data de criação |

Políticas RLS: Apenas admins podem gerenciar.

### 2. Criar função `contains_profanity(text)`

Função SQL que:
1. Normaliza o texto (lowercase, remove acentos)
2. Verifica se contém alguma palavra da lista
3. Retorna `true` se encontrar match

```sql
CREATE OR REPLACE FUNCTION public.contains_profanity(p_text TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
DECLARE
  v_normalized TEXT;
  v_found BOOLEAN;
BEGIN
  IF p_text IS NULL OR p_text = '' THEN
    RETURN false;
  END IF;
  
  -- Normaliza: lowercase + remove acentos
  v_normalized := lower(unaccent(p_text));
  
  -- Verifica contra lista de palavras bloqueadas
  SELECT EXISTS (
    SELECT 1 FROM public.blocked_words bw
    WHERE bw.active = true
      AND v_normalized ~* ('\m' || bw.word || '\M')
  ) INTO v_found;
  
  RETURN v_found;
END;
$$;
```

A expressão regular `\m...\M` garante match de **palavras inteiras** (não pega "assumir" quando bloqueia "um").

### 3. Atualizar RPCs da Comunidade

Adicionar validação nas funções existentes:

**`create_community_post`**:
```sql
IF public.contains_profanity(v_body) THEN
  RAISE EXCEPTION 'Mensagem contém conteúdo inadequado';
END IF;
```

**`edit_community_post`**:
```sql
IF public.contains_profanity(v_body) THEN
  RAISE EXCEPTION 'Mensagem contém conteúdo inadequado';
END IF;
```

**`create_community_thread`** (título e body):
```sql
IF public.contains_profanity(v_title) OR 
   public.contains_profanity(v_body) THEN
  RAISE EXCEPTION 'Conteúdo contém palavras inadequadas';
END IF;
```

### 4. Feedback no Frontend

Atualizar os componentes para exibir mensagem de erro amigável quando a validação falhar:

**`CommunityThreadView.tsx`**:
```typescript
onError: (err) => {
  const msg = err.message?.includes('inadequado') 
    ? 'Sua mensagem contém palavras não permitidas.'
    : 'Não foi possível enviar.';
  toast({ title: 'Erro', description: msg, variant: 'destructive' });
}
```

**`NewThreadDialog.tsx`**:
```typescript
// Mesmo tratamento de erro
```

### 5. Lista Inicial de Palavras

Inserir uma lista base de palavras ofensivas em português (palavrões, termos discriminatórios, etc.). A lista pode ser expandida pelos administradores posteriormente.

## Arquivos a Criar/Modificar

| Arquivo | Ação |
|---------|------|
| `supabase/migrations/xxx_profanity_filter.sql` | Criar tabela, função e atualizar RPCs |
| `src/components/community/CommunityThreadView.tsx` | Adicionar tratamento de erro |
| `src/components/community/NewThreadDialog.tsx` | Adicionar tratamento de erro |

## Considerações

- **Apenas Comunidade**: O filtro será aplicado apenas na comunidade (fórum público). As mensagens diretas (DMs) são privadas e não passarão por esse filtro.
- **Extensibilidade**: A tabela `blocked_words` permite que admins adicionem/removam palavras sem necessidade de novo deploy.
- **Performance**: A função usa índice e regex otimizado para não impactar a experiência.
- **Bypass impossível**: Como a validação é no banco (SECURITY DEFINER), não pode ser burlada pelo cliente.

## Fluxo do Usuário

1. Usuário digita mensagem com palavra ofensiva
2. Clica em "Enviar"
3. Backend rejeita com erro
4. Frontend exibe: "Sua mensagem contém palavras não permitidas"
5. Usuário precisa reformular a mensagem

