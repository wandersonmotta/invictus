

## Reestruturar fluxo Limpa Nome: lista local, olho para visualizar, + para adicionar

### Problema atual

1. Ao clicar "Adicionar a lista", o sistema ja salva no banco -- mesmo sem pagamento
2. Os cards de status expandem com chevron mostrando nomes inline (nao segue a referencia)
3. Falta o icone de olho para visualizar nomes pagos
4. Falta a tela de detalhes ao clicar no olho de cada nome

### O que muda

**1. AddNomeView -- lista apenas em memoria (sem salvar no banco)**
- "Adicionar a lista" NAO insere no banco. Apenas adiciona ao estado local `addedNames`
- Se fechar ou recarregar a pagina, perde a lista
- Salvar no banco e fazer upload dos documentos SOMENTE ao clicar "Ir para pagamento" (futuramente, quando o pagamento for implementado, salva apos confirmacao)
- Por enquanto, "Ir para pagamento" salva tudo no banco de uma vez e exibe mensagem de sucesso

**2. LimpaNomeView -- cards com icone de olho e +**
- Remover o chevron (expand inline)
- Em cada card de status, colocar icone de olho (Eye do lucide) que navega para uma tela de listagem dos nomes daquele status
- No card "Aberto", manter o botao + que abre o AddNomeView
- Layout do card conforme referencia:
  - Badge de status + texto "Sem atualizacao" no topo
  - "Total enviado / em andamento / finalizados" com o numero grande
  - Icone olho (e + no Aberto) no canto direito

**3. Nova tela: NomesListView -- lista de nomes por status**
- Abre ao clicar no olho de um card de status
- Header com botao voltar e titulo
- "Total de nomes: X"
- Campo de busca por CPF/CNPJ
- Lista de nomes com: Nome (uppercase), CPF/CNPJ abaixo, e icone de olho ao lado
- Separador tracejado entre itens (como na referencia)

**4. Nova tela: NomeDetailView -- detalhes de um nome**
- Abre ao clicar no olho de um nome na lista
- Header com botao voltar
- Exibe nome completo e CPF/CNPJ
- Se houver documentos enviados (ficha associativa, identidade), exibe links para visualizar
- Se nao houver documentos, exibe apenas nome e CPF/CNPJ
- Somente leitura, sem opcao de editar

### Fluxo do usuario

```text
LimpaNomeView (dashboard)
  |
  |-- [+] --> AddNomeView (formulario, lista em memoria)
  |              |-- "Adicionar a lista" (apenas local)
  |              |-- "Ir para pagamento" (salva tudo no banco)
  |              |-- Voltar (perde lista)
  |
  |-- [olho] --> NomesListView (nomes pagos daquele status)
                    |
                    |-- [olho por nome] --> NomeDetailView (detalhes + documentos)
```

### Detalhes tecnicos

**Arquivo: `src/components/servicos/AddNomeView.tsx`**
- Remover insert no banco da mutacao "Adicionar a lista"
- O `addedNames` passa a ser puramente local (sem id do banco)
- Gerar id temporario com `crypto.randomUUID()` para a key do React
- Armazenar os arquivos (fichaFile, identidadeFile) por nome na lista local
- Criar nova mutacao para "Ir para pagamento" que:
  - Insere cada nome na tabela `limpa_nome_requests`
  - Faz upload dos documentos para cada nome
  - Insere registros em `limpa_nome_documents`
  - Limpa a lista e exibe sucesso
  - Invalida o cache de queries

**Arquivo: `src/components/servicos/LimpaNomeView.tsx`**
- Adicionar estado para navegacao interna: `viewMode` (dashboard / nomes-list / nome-detail)
- Substituir chevron por `Eye` do lucide-react em todos os cards
- Remover logica de expand inline
- Ao clicar olho: setar `viewMode = "nomes-list"` com o status filtrado
- Renderizar componente correspondente baseado em `viewMode`

**Novo arquivo: `src/components/servicos/NomesListView.tsx`**
- Props: `status`, `onBack`, `onViewDetail(request)`
- Busca nomes do banco filtrados por status
- Campo de busca filtra localmente por CPF/CNPJ
- Cada item tem icone de olho que chama `onViewDetail`

**Novo arquivo: `src/components/servicos/NomeDetailView.tsx`**
- Props: `request` (dados do nome), `onBack`
- Exibe nome, documento
- Busca documentos da tabela `limpa_nome_documents` pelo `request_id`
- Se houver documentos, exibe links/botoes para visualizar (gera URL publica do storage)
- Se nao houver, exibe somente os dados basicos

### Interface do NomeItem local (AddNomeView)

```text
interface LocalNomeItem {
  tempId: string;          // crypto.randomUUID()
  person_name: string;
  document: string;
  whatsapp: string;
  fichaFile: File | null;
  identidadeFile: File | null;
}
```

### Arquivos a criar/modificar

- `src/components/servicos/AddNomeView.tsx` (modificar -- lista local, salvar tudo no pagamento)
- `src/components/servicos/LimpaNomeView.tsx` (modificar -- olho + navegacao)
- `src/components/servicos/NomesListView.tsx` (criar -- lista de nomes por status)
- `src/components/servicos/NomeDetailView.tsx` (criar -- detalhes de um nome)

