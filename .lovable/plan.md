

# Upload de Lista e Baixar Modelo -- Limpa Nome

## Resumo

Adicionar dois botoes no topo da tela de cadastro (AddNomeView): **"Baixar modelo"** e **"Upload lista"**. O modelo e um arquivo Excel (.xlsx) com tres colunas (Nome, CPF/CNPJ, WhatsApp). O upload le o arquivo e popula automaticamente a lista de nomes.

---

## O que muda na interface

Na area entre o titulo "Cadastre no campo abaixo" e o formulario, dois botoes serao adicionados lado a lado (conforme a imagem de referencia):

- **Upload lista** (icone de upload, fundo roxo) -- abre seletor de arquivo .xlsx/.xls
- **Baixar modelo** (icone de download, borda) -- faz download de um arquivo Excel modelo

---

## Detalhes tecnicos

### 1. Dependencia: SheetJS (xlsx)

Instalar o pacote `xlsx` para ler e gerar arquivos Excel no navegador. Nenhuma dependencia backend necessaria.

### 2. Funcao "Baixar modelo"

Criar um arquivo Excel em memoria usando `xlsx` com:
- Sheet chamada "Limpa Nome"
- Cabecalhos: `Nome | Nome Fantasia`, `CPF | CNPJ`, `WhatsApp`
- Uma linha de exemplo preenchida para guiar o usuario
- Dispara download automatico do arquivo `modelo-limpa-nome.xlsx`

### 3. Funcao "Upload lista"

- Input file oculto aceita `.xlsx, .xls`
- Ao selecionar arquivo, le com `xlsx` e extrai as linhas
- Para cada linha valida (com pelo menos nome preenchido), cria um item `LocalNomeItem` e adiciona ao estado `addedNames`
- Formata CPF/CNPJ e WhatsApp automaticamente
- Exibe toast de sucesso com quantidade de nomes importados
- Linhas vazias ou sem nome sao ignoradas silenciosamente

### 4. Alteracoes no componente AddNomeView

- Adicionar os dois botoes no header, ao lado do titulo "Cadastre no campo abaixo" (alinhados a direita)
- Adicionar input file oculto para Excel
- Adicionar funcoes `handleDownloadTemplate` e `handleUploadList`
- Os nomes importados via planilha entram na mesma lista (`addedNames`) que os cadastrados manualmente, mantendo todo o fluxo de pagamento identico

### 5. Validacao na importacao

- Linhas sem nome serao ignoradas
- CPF/CNPJ sera formatado automaticamente mas **nao** validado via API (para nao travar com listas grandes) -- validacao local apenas (algoritmo)
- WhatsApp tera o prefixo +55 adicionado automaticamente
- Documentos (ficha/identidade) ficam como `null` nos itens importados via planilha -- o usuario pode adicionar depois manualmente se desejar

---

## Arquivos modificados

| Arquivo | Acao |
|---|---|
| `package.json` | Adicionar dependencia `xlsx` |
| `src/components/servicos/AddNomeView.tsx` | Adicionar botoes, input file, logica de download/upload |

Nenhuma alteracao no banco de dados ou edge functions e necessaria -- o fluxo de pagamento permanece identico.

