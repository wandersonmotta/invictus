

# Validação de CPF multi-source gratuito (melhor esforço)

## Problema atual
A BrasilAPI retorna 404 para CPFs que existem na Receita Federal, bloqueando usuários legítimos de salvar sua chave PIX.

## Solução
Atualizar a edge function `validate-cpf` para consultar **múltiplas fontes gratuitas** em sequência. Se alguma confirmar o CPF, aceita. Se todas falharem ou retornarem 404, aceita com fallback (validação matemática já passou).

## Fontes de consulta (em ordem)

1. **BrasilAPI** -- `https://brasilapi.com.br/api/cpf/v1/{cpf}` (gratuita, instável)
2. **Invertexto** -- `https://api.invertexto.com/v1/validator?value={cpf}&token=free` (gratuita, sem autenticação para validação básica)
3. **Nuvem Fiscal** -- `https://api.nuvemfiscal.com.br/cpf/{cpf}` (free tier disponível)

Se qualquer uma responder positivamente (CPF existe), retorna `valid: true` com o nome quando disponível. Se todas falharem (timeout, 404, erro), aceita com `fallback: true` pois a validação matemática já barrou CPFs inventados.

## Lógica de decisão

- Validação matemática falha -> rejeita imediatamente (CPF inventado)
- Alguma API confirma existência (200) -> aceita com nome do titular
- Todas as APIs retornam 404 -> aceita com fallback (melhor esforço)
- Todas as APIs dão timeout/erro -> aceita com fallback

## O que muda para o usuário

- CPFs inventados continuam bloqueados (validação matemática)
- CPFs reais terão mais chance de serem confirmados (múltiplas fontes)
- Se nenhuma API estiver disponível, o fluxo não trava -- salva normalmente

## Detalhes Técnicos

**Arquivo alterado:**
- `supabase/functions/validate-cpf/index.ts` -- reescrever para tentar múltiplas fontes em sequência, com timeout individual de 5 segundos por fonte

**Estrutura da function:**

```text
1. Recebe CPF
2. Validação matemática (local, instantânea)
3. Tenta BrasilAPI (5s timeout)
   - 200 -> retorna valid: true + nome
   - 404 -> continua para próxima fonte
   - erro -> continua
4. Tenta fontes alternativas (5s timeout cada)
   - 200 -> retorna valid: true + nome
   - erro -> continua
5. Nenhuma fonte confirmou -> retorna valid: true, fallback: true
```

**Resposta da function (sem alteração no contrato):**
- `{ valid: true, name: "NOME", fallback: false }` -- confirmado por API
- `{ valid: true, name: null, fallback: true }` -- não confirmado, mas matematicamente válido
- `{ valid: false, reason: "invalid_digits" }` -- CPF inventado

**Frontend (`PixKeyCard.tsx`):**
- Sem alteração necessária -- o contrato da resposta é o mesmo. CPFs matematicamente inválidos continuam sendo rejeitados, e o fallback já é tratado como aceitável.
