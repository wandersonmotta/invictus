

# Validação de CPF via Receita Federal (API externa)

## Situação atual
O projeto já tem validação **matemática** do CPF (dígitos verificadores). Isso impede números inventados, mas não verifica se o CPF realmente existe na Receita Federal.

## O que será feito

### 1. Nova edge function: `validate-cpf`
Criar uma function backend que:
- Recebe o CPF do frontend
- Primeiro valida matematicamente (rápido, sem chamada externa)
- Depois consulta a **BrasilAPI** (`https://brasilapi.com.br/api/cpf/v1/{cpf}`), que é gratuita e consulta a base da Receita Federal
- Retorna: CPF válido/inválido + nome do titular (quando disponível)
- Se a API externa estiver fora do ar, aceita o CPF apenas com validação matemática (fallback seguro)

### 2. Atualizar `PixKeyCard.tsx`
- Ao clicar "Salvar", chamar a edge function antes de gravar no banco
- Mostrar estado de "Verificando CPF..." durante a consulta
- Exibir erro claro se o CPF não existir na Receita
- Se a API estiver indisponível, salvar mesmo assim (com validação matemática)

### 3. Sem necessidade de API key
A BrasilAPI é **gratuita e aberta** -- não precisa de chave de API nem configuração de secrets.

## Fluxo do usuário

1. Digita o CPF no campo
2. Clica "Salvar chave PIX"
3. Validação matemática local (instantânea)
4. Se passa, chama a edge function que consulta a Receita
5. Se o CPF existe: salva normalmente
6. Se não existe: mostra "CPF não encontrado na Receita Federal"
7. Se a API falhar (timeout/indisponível): salva com validação matemática apenas

---

## Detalhes Técnicos

**Arquivos criados:**
- `supabase/functions/validate-cpf/index.ts` -- edge function que consulta BrasilAPI

**Arquivos alterados:**
- `src/components/carteira/PixKeyCard.tsx` -- integrar chamada da edge function no fluxo de save
- `supabase/config.toml` -- registrar a nova function com `verify_jwt = false`

**Edge function (`validate-cpf`):**
```
POST /validate-cpf
Body: { "cpf": "12345678900" }

Resposta sucesso: { "valid": true, "name": "NOME DA PESSOA" }
Resposta falha:   { "valid": false, "reason": "not_found" }
Resposta fallback: { "valid": true, "name": null, "fallback": true }
```

**Fallback:** Se a BrasilAPI retornar erro 5xx ou timeout, a function retorna `valid: true` com `fallback: true` para não bloquear o usuário quando o serviço externo estiver instável.
