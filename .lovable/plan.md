
## Corrigir auto-preenchimento de Razão Social para CNPJ

### Problema

A API cpfcnpj.com.br retorna o campo `razao` (nao `razao_social`) para consultas de CNPJ no Pacote 4. O codigo atual procura por `data.razao_social`, que nao existe na resposta, resultando em `name: null`.

### Correção

Arquivo: `supabase/functions/hubdev-document-lookup/index.ts`

Alterar a linha que extrai o nome do CNPJ de:

```text
data.razao_social ?? data.nome ?? null
```

Para:

```text
data.razao ?? data.fantasia ?? data.nome ?? null
```

Isso cobre todos os campos possiveis da resposta da API:
- `razao` - Razao social (nome legal da empresa)
- `fantasia` - Nome fantasia (caso a razao esteja vazia por algum motivo)
- `nome` - Fallback generico

### Escopo

- Apenas 1 linha alterada em 1 arquivo
- Nenhuma mudanca no frontend necessaria
- O campo `tradeName` no client (`validateCpfClient.ts`) ja esta preparado mas nao e usado atualmente; pode ser conectado futuramente se necessario
