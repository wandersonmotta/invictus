

## Formulario "Adicionar Nome" - Tela Completa

Quando o usuario clicar no botao "+" no card Aberto, em vez de abrir um dialog pequeno, vai abrir uma tela completa identica a referencia enviada.

### Layout da tela (conforme referencia)

1. **Topo**: Botao "Voltar" com seta
2. **Header**: "Cadastre no campo abaixo"
3. **Formulario** dentro de um card:
   - **Nome | Nome Fantasia*** - campo de texto com icone de pessoa
   - **CPF | CNPJ*** - campo com mascara e icone de documento
   - **WhatsApp*** - campo com prefixo "+55" e icone da bandeira do Brasil
4. **Secao de documentos**: "Faca o envio dos documentos abaixo para ativar a garantia"
   - Dois botoes de upload lado a lado: "Ficha associativa" e "Identidade ou Cartao CNPJ"
5. **Botao "Adicionar a lista"** (roxo/primary, largura total)
6. **Card "Lista de nomes"**: Mostra contagem de nomes e valor total (R$)
7. **Botao "Ir para pagamento"** (vermelho/rosa, largura total)

### O que sera feito

**Banco de dados** - Adicionar colunas na tabela `limpa_nome_requests`:
- `whatsapp` (text, nullable) - numero de WhatsApp
- Criar bucket de storage `limpa-nome-docs` para os arquivos enviados

Adicionar tabela `limpa_nome_documents` para armazenar metadados dos arquivos:
- `id`, `request_id` (FK), `doc_type` (ficha_associativa / identidade), `storage_path`, `file_name`, `created_at`

**Novo componente** - `AddNomeView.tsx` substituindo o `AddNomeDialog.tsx`:
- Tela completa (nao dialog) com o layout da referencia
- Campos com validacao: nome obrigatorio, CPF/CNPJ com mascara e validacao, WhatsApp obrigatorio
- Upload de documentos usando file storage
- Lista de nomes adicionados na sessao com contagem e valor
- Botao "Ir para pagamento" (por enquanto apenas visual, sem integracao de pagamento)

**Modificar `LimpaNomeView.tsx`**:
- Quando clicar no "+", em vez de abrir dialog, navegar para a nova view `AddNomeView`
- Adicionar estado para controlar a navegacao entre as views

### Detalhes tecnicos

**Migracao SQL:**

```sql
ALTER TABLE public.limpa_nome_requests
  ADD COLUMN whatsapp text;

CREATE TABLE public.limpa_nome_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.limpa_nome_requests(id) ON DELETE CASCADE,
  doc_type text NOT NULL,
  storage_path text NOT NULL,
  file_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.limpa_nome_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own docs"
  ON public.limpa_nome_documents FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM limpa_nome_requests r
    WHERE r.id = request_id AND r.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own docs"
  ON public.limpa_nome_documents FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM limpa_nome_requests r
    WHERE r.id = request_id AND r.user_id = auth.uid()
  ));

CREATE POLICY "Admins manage all docs"
  ON public.limpa_nome_documents FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
```

Criar bucket de storage:
```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('limpa-nome-docs', 'limpa-nome-docs', false);

CREATE POLICY "Users upload own docs"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'limpa-nome-docs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users view own docs"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'limpa-nome-docs' AND auth.uid()::text = (storage.foldername(name))[1]);
```

**Novos/modificados arquivos:**

- `src/components/servicos/AddNomeView.tsx` - Tela completa com formulario identico a referencia
- `src/components/servicos/LimpaNomeView.tsx` - Trocar dialog por navegacao para AddNomeView
- Remover uso do `AddNomeDialog.tsx` (pode manter o arquivo mas nao sera mais usado)

**Componentes do formulario:**
- Campo Nome com icone User
- Campo CPF/CNPJ com mascara automatica (usa `formatCPF` existente)
- Campo WhatsApp com prefixo "+55" fixo e mascara de telefone
- Dois botoes de upload de arquivo com icone de upload
- Lista de nomes adicionados com contagem e valor
- Botoes "Adicionar a lista" e "Ir para pagamento"
