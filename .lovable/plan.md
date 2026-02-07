

## Validacao de CPF/CNPJ com auto-preenchimento do nome

### Problema atual

As APIs brasileiras (BrasilAPI, Invertexto, Nuvem Fiscal) bloqueiam requisicoes vindas de IPs fora do Brasil. As Edge Functions rodam em servidores europeus, entao as consultas falham. A solucao atual no cliente (`validateCpfClient.ts`) ja roda no navegador do usuario (IP brasileiro), mas ainda nao esta integrada ao formulario de "Adicionar Nome".

### Solucao

Usar a validacao **direto do navegador do usuario** (que tem IP brasileiro) para consultar as APIs da Receita Federal. Quando o usuario terminar de digitar o CPF ou CNPJ completo, o sistema:

1. Valida matematicamente os digitos verificadores
2. Consulta as APIs brasileiras **a partir do navegador** (IP brasileiro)
3. Se encontrar o nome da pessoa/empresa, preenche automaticamente o campo "Nome"
4. Mostra feedback visual (carregando, valido, invalido)

Para **CNPJ**, adicionar consulta a BrasilAPI (`/cnpj/v1/{cnpj}`) que retorna razao social e nome fantasia.

### O que sera feito

**1. Atualizar `src/lib/validateCpfClient.ts`**
- Renomear para um modulo mais generico de validacao de documentos
- Adicionar funcao `validateCnpjFromBrowser` que consulta `https://brasilapi.com.br/api/cnpj/v1/{digits}` (funciona do browser com IP BR)
- Retornar razao social e nome fantasia do CNPJ
- Adicionar validacao matematica de CNPJ (digitos verificadores)

**2. Criar `src/lib/cnpj.ts`**
- Funcao `isValidCNPJ` para validacao matematica dos digitos verificadores do CNPJ
- Funcao `formatCNPJ` (mover do AddNomeView para reutilizacao)

**3. Atualizar `src/components/servicos/AddNomeView.tsx`**
- Adicionar debounce de 500ms no campo CPF/CNPJ
- Quando o documento estiver completo (11 digitos para CPF, 14 para CNPJ):
  - Mostrar indicador de "Validando..." abaixo do campo
  - Chamar `validateCpfFromBrowser` ou `validateCnpjFromBrowser` conforme o tipo
  - Se valido e nome encontrado: preencher automaticamente o campo "Nome | Nome Fantasia"
  - Se valido mas sem nome: permitir digitacao manual
  - Se invalido: mostrar erro "CPF/CNPJ invalido" em vermelho
- O campo Nome fica editavel mesmo apos auto-preenchimento
- O botao "Adicionar a lista" so fica habilitado se o documento foi validado

### Fluxo do usuario

```text
Usuario digita CPF/CNPJ
        |
        v
  Digitos completos? (11 ou 14)
        |
       Sim
        |
        v
  Validacao matematica
        |
    Valido?
   /       \
  Nao       Sim
  |          |
  v          v
Erro      Consulta APIs do browser (IP BR)
vermelho     |
          Nome encontrado?
         /          \
       Sim           Nao
        |             |
        v             v
  Preenche nome   Campo nome vazio
  automaticamente (digitacao manual)
```

### Detalhes tecnicos

**Novo arquivo `src/lib/cnpj.ts`:**
- `isValidCNPJ(cnpj: string): boolean` - validacao matematica
- `formatCNPJ(value: string): string` - formatacao visual

**Atualizar `src/lib/validateCpfClient.ts`:**
- Adicionar `validateCnpjFromBrowser(digits: string)` que consulta `https://brasilapi.com.br/api/cnpj/v1/{digits}`
- Retorna `{ valid: true, name: string | null, tradeName: string | null, fallback: boolean }`

**Atualizar `src/components/servicos/AddNomeView.tsx`:**
- Novos estados: `docStatus` (idle/validating/valid/invalid), `docName` (nome retornado)
- useEffect com debounce no campo `document`
- Feedback visual: spinner ao validar, check verde se valido, X vermelho se invalido
- Auto-preenchimento do campo `personName` quando nome e retornado
- Importar `isValidCPF` de `src/lib/cpf.ts` e `isValidCNPJ` do novo `src/lib/cnpj.ts`

**Nao sera alterado:**
- A Edge Function `validate-cpf` permanece como fallback, mas o fluxo principal sera 100% client-side (browser com IP brasileiro)
