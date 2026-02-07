

## Integrar pagamento Pix via Stripe no fluxo Limpa Nome

### Resumo

Quando o usuario clicar "Ir para pagamento", o sistema criara uma sessao de checkout no Stripe com o valor total (R$ 150 x quantidade de nomes), gerando a opcao de pagamento via Pix (QR Code + codigo copia-e-cola). Apos o pagamento ser confirmado, o usuario e redirecionado de volta ao app e os nomes sao salvos no banco de dados.

### Fluxo do pagamento

```text
Usuario monta lista local (AddNomeView)
  |
  |-- Clica "Ir para pagamento"
  |     |
  |     |-- Frontend envia lista para edge function "create-limpa-nome-payment"
  |     |-- Edge function cria produto/sessao no Stripe com valor total
  |     |-- Stripe retorna URL do checkout
  |     |-- Frontend redireciona para Stripe Checkout (Pix habilitado)
  |
  |-- Usuario paga via Pix (QR Code ou copia-e-cola)
  |     |
  |     |-- Stripe confirma pagamento em tempo real
  |     |-- Redireciona para pagina de sucesso
  |
  |-- Pagina de sucesso salva os nomes no banco
        |-- Insere registros em limpa_nome_requests
        |-- Faz upload dos documentos
        |-- Insere registros em limpa_nome_documents
```

### O que sera criado/modificado

**1. Produto no Stripe**
- Criar produto "Limpa Nome - Consulta" com preco unitario de R$ 150,00 (15000 centavos BRL)
- O preco sera usado na sessao de checkout com quantidade dinamica (baseada no numero de nomes)

**2. Nova edge function: `create-limpa-nome-payment`**
- Recebe a lista de nomes do frontend (sem salvar no banco ainda)
- Autentica o usuario via token
- Cria sessao de checkout Stripe com:
  - `mode: "payment"` (pagamento unico)
  - `payment_method_types: ["pix"]`
  - `line_items` com o preco do produto e quantidade = numero de nomes
  - `metadata` com os dados dos nomes (JSON serializado) para recuperar depois
  - `success_url` apontando para rota de sucesso com session_id
  - `cancel_url` apontando de volta para /servicos
- Retorna a URL do checkout para redirecionamento

**3. Nova edge function: `verify-limpa-nome-payment`**
- Recebe o `session_id` do Stripe
- Verifica se o pagamento foi confirmado (`payment_status === "paid"`)
- Recupera os dados dos nomes do metadata da sessao
- Insere os registros no banco (`limpa_nome_requests`)
- Retorna confirmacao de sucesso
- O upload de documentos sera tratado separadamente (os arquivos ficam no frontend)

**4. Modificar `AddNomeView.tsx`**
- No clique de "Ir para pagamento":
  - Salvar a lista de nomes no `sessionStorage` (para recuperar apos redirect)
  - Chamar edge function `create-limpa-nome-payment` com os dados
  - Redirecionar para a URL do Stripe Checkout
- Remover a mutacao atual que salva direto no banco

**5. Nova rota/pagina: pagina de sucesso do pagamento**
- Rota: `/pagamento-sucesso`
- Recebe `session_id` como query param
- Chama `verify-limpa-nome-payment` para confirmar pagamento
- Recupera arquivos do `sessionStorage`
- Faz upload dos documentos para o storage
- Insere registros de documentos em `limpa_nome_documents`
- Exibe mensagem de sucesso
- Redireciona para /servicos apos confirmacao

**6. Configuracao do Stripe**
- Habilitar Pix como metodo de pagamento no dashboard do Stripe (instrucao para o usuario)

### Detalhes tecnicos

**Produto Stripe**
- Nome: "Limpa Nome - Consulta"
- Preco: R$ 150,00 (15000 centavos em BRL)
- Tipo: one-time (nao recorrente)

**Edge function `create-limpa-nome-payment` (supabase/functions/create-limpa-nome-payment/index.ts)**
- CORS headers padrao
- Autenticacao via Supabase token
- Stripe SDK via `https://esm.sh/stripe@18.5.0`
- API version: `2025-08-27.basil`
- Cria customer no Stripe se nao existir
- Sessao de checkout com Pix habilitado
- Metadata armazena: nomes, documentos, whatsapp (JSON)
- `verify_jwt = false` no config.toml

**Edge function `verify-limpa-nome-payment` (supabase/functions/verify-limpa-nome-payment/index.ts)**
- Recebe session_id
- Verifica pagamento no Stripe
- Insere dados no banco usando service role key
- `verify_jwt = false` no config.toml

**Pagina de sucesso (`src/pages/PagamentoSucesso.tsx`)**
- Lê `session_id` da URL
- Recupera lista de nomes e arquivos do `sessionStorage`
- Chama verify-limpa-nome-payment
- Faz upload dos arquivos via Supabase Storage
- Insere metadados dos documentos na tabela

**Limitacao importante sobre arquivos**
- `sessionStorage` nao pode armazenar objetos File diretamente
- Os arquivos (ficha associativa, identidade) serao convertidos para base64 antes de salvar no sessionStorage
- Na pagina de sucesso, serao convertidos de volta para File antes do upload

### Arquivos a criar/modificar

- Criar produto e preco no Stripe (via ferramenta)
- `supabase/functions/create-limpa-nome-payment/index.ts` (criar)
- `supabase/functions/verify-limpa-nome-payment/index.ts` (criar)
- `supabase/config.toml` -- nao editavel diretamente, mas registrar verify_jwt = false
- `src/components/servicos/AddNomeView.tsx` (modificar -- redirecionar para Stripe)
- `src/pages/PagamentoSucesso.tsx` (criar)
- `src/App.tsx` (adicionar rota /pagamento-sucesso)

