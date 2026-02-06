

# Validação de CPF direto do navegador (IP brasileiro)

## Problema
As APIs gratuitas brasileiras (BrasilAPI, Invertexto, Nuvem Fiscal) bloqueiam requisições de IPs fora do Brasil. A edge function roda na Europa, por isso todas falham. Mas o navegador do usuário esta no Brasil.

## Solucao
Mover as chamadas de validacao externa para o **frontend** (navegador do usuario). O navegador esta no Brasil, entao as APIs brasileiras vao responder normalmente.

A edge function continua existindo apenas para a validacao matematica (ou pode ser removida, ja que a validacao matematica ja existe no frontend via `isValidCPF` em `src/lib/cpf.ts`).

## Fluxo proposto

```text
Usuario digita CPF (11 digitos)
  |
  v
1. Validacao matematica local (instantanea, ja existe)
  |-- Falhou -> "CPF invalido"
  |-- Passou -> continua
  |
  v
2. Consulta BrasilAPI direto do navegador (5s timeout)
  |-- 200 -> "CPF valido" + nome do titular
  |-- 404/erro -> tenta proxima fonte
  |
  v
3. Consulta Invertexto direto do navegador (5s timeout)
  |-- 200 + valid:true -> "CPF valido"
  |-- erro -> tenta proxima
  |
  v
4. Consulta Nuvem Fiscal direto do navegador (5s timeout)
  |-- 200 -> "CPF valido" + nome
  |-- erro -> fallback
  |
  v
5. Nenhuma fonte respondeu -> "CPF valido" (fallback matematico)
```

## O que muda para o usuario
- CPFs reais agora serao confirmados com o nome do titular (as APIs vao responder porque o IP e brasileiro)
- A experiencia continua sendo em tempo real (digita e valida)
- Se por algum motivo as APIs falharem, o fallback matematico continua funcionando

## Detalhes tecnicos

**Arquivo principal alterado:**
- `src/components/carteira/PixKeyCard.tsx` -- mover a logica de consulta multi-source para o proprio componente, chamando as APIs diretamente via `fetch` do navegador em vez de chamar a edge function

**Logica no componente:**
- Manter o debounce de 400ms apos digitar 11 digitos
- Manter a validacao matematica local como primeiro filtro (`isValidCPF` de `src/lib/cpf.ts`)
- Substituir a chamada `supabase.functions.invoke("validate-cpf")` por chamadas diretas as APIs brasileiras em sequencia
- Manter os mesmos estados visuais (loading spinner, check verde, X vermelho)

**Edge function `validate-cpf`:**
- Pode ser mantida como backup, mas nao sera mais chamada pelo `PixKeyCard`. Nenhuma alteracao necessaria nela.

**Nenhuma alteracao no backend ou banco de dados.**
