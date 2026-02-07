

## Corrigir validacao de CPF/CNPJ e auto-preenchimento de nome

### Problema identificado

Nos logs de rede, as tres APIs de CPF estao falhando:
- **BrasilAPI** `/cpf/v1/` retorna **404** (endpoint foi removido)
- **Invertexto** retorna **401** (token "free" nao funciona mais)
- **NuvemFiscal** retorna **401** (requer autenticacao)

Como todas falham, o sistema cai no fallback (validacao matematica apenas) e nunca retorna o nome.

Para CNPJ, o usuario quer apenas a **razao social** (nao nome fantasia).

### Solucao

**1. CPF - Adicionar nova fonte: API do Ministerio da Saude (SCPA)**

Existe uma API gratuita e funcional que valida se o CPF esta registrado na Receita Federal:
```
GET https://scpa-backend.saude.gov.br/public/scpa-usuario/validacao-cpf/{cpf}
```

Essa API **confirma que o CPF existe** na base da Receita Federal, porem **nao retorna o nome** (nenhuma API gratuita retorna o nome do CPF atualmente). O campo Nome ficara para preenchimento manual pelo usuario quando for CPF.

**2. CNPJ - Corrigir para retornar razao social + adicionar ReceitaWS como fallback**

- Trocar a prioridade: usar `razao_social` ao inves de `nome_fantasia`
- Adicionar ReceitaWS como segunda fonte: `GET https://receitaws.com.br/v1/cnpj/{cnpj}` (retorna campo `nome` = razao social)
- BrasilAPI continua como primeira tentativa

**3. Limpar fontes mortas**

Remover `tryInvertexto` e `tryNuvemFiscal` (ambas retornam 401 permanentemente). Substituir `tryBrasilAPI` para CPF pelo SCPA.

### Arquivos a modificar

**`src/lib/validateCpfClient.ts`**:
- Remover `tryBrasilAPI` (para CPF), `tryInvertexto`, `tryNuvemFiscal`
- Adicionar `trySCPA(digits)` que chama a API do Ministerio da Saude para validar CPF
- Atualizar `validateCpfFromBrowser` para usar SCPA (valida existencia, sem nome)
- Atualizar `validateCnpjFromBrowser`:
  - Priorizar `razao_social` no retorno
  - Adicionar ReceitaWS como segunda fonte para CNPJ

**`src/components/servicos/AddNomeView.tsx`**:
- Ajustar label do campo Nome para "Nome | Razao Social*" (refletir que CNPJ retorna razao social)
- Quando for CPF e nao houver nome retornado, manter campo editavel com placeholder "Informe o nome completo"

### Detalhes tecnicos

Nova funcao SCPA para CPF:
```typescript
async function trySCPA(digits: string): Promise<{ name: string | null } | null> {
  const res = await fetchWithTimeout(
    `https://scpa-backend.saude.gov.br/public/scpa-usuario/validacao-cpf/${digits}`
  );
  if (res.ok) {
    const data = await res.json();
    // API retorna objeto se CPF existe, ou erro se nao
    if (!data?.error) return { name: null }; // CPF valido, sem nome
  }
  return null;
}
```

ReceitaWS fallback para CNPJ:
```typescript
async function tryReceitaWS(digits: string): Promise<{ razaoSocial: string | null } | null> {
  const res = await fetchWithTimeout(
    `https://receitaws.com.br/v1/cnpj/${digits}`
  );
  if (res.ok) {
    const data = await res.json();
    if (data.status !== "ERROR") {
      return { razaoSocial: data.nome ?? null };
    }
  }
  return null;
}
```

CNPJ corrigido para priorizar razao social:
```typescript
// Antes: name: nomeFantasia || razaoSocial
// Depois: name: razaoSocial
```

### Resultado esperado

- **CPF**: Valida se o CPF existe na Receita Federal (via SCPA). Mostra "Documento valido". Usuario preenche o nome manualmente.
- **CNPJ**: Busca e preenche automaticamente a **razao social** da empresa. Mostra "Documento valido" com nome auto-preenchido.
- Ambos mostram feedback visual (spinner, check verde, X vermelho).

