

## Barra de filtro no topo da pagina Pagamentos

Adicionar uma barra de filtro horizontal no topo da pagina (abaixo do titulo) com tres opcoes: **Todos**, **Pendentes** e **Aprovados**. Ao clicar em uma opcao, a pagina mostra apenas a secao correspondente (ou ambas no caso de "Todos").

### Arquivo a modificar

**`src/pages/Pagamentos.tsx`**

- Adicionar estado `filter` com valores `"all" | "pending" | "approved"`, default `"all"`
- Renderizar um grupo de botoes (toggle group ou tabs) logo abaixo do titulo:
  - "Todos" / "Pendentes" / "Aprovados"
  - Estilo: botoes compactos lado a lado, o ativo com destaque (bg-primary)
- Condicionar a exibicao das secoes conforme o filtro:
  - `"all"`: mostra Pendentes + Aprovados (como esta hoje)
  - `"pending"`: mostra somente Pendentes
  - `"approved"`: mostra somente Aprovados

### Detalhes visuais

- Usar componentes `Tabs` / `TabsList` / `TabsTrigger` ja existentes no projeto (`src/components/ui/tabs.tsx`)
- Layout compacto, alinhado a esquerda, abaixo do titulo "Pagamentos"
- Manter o estilo dark premium da aplicacao

