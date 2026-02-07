

## Funcionalidade "Limpa Nome" - Painel de Gestao de Nomes

Ao clicar em "Limpa Nome" dentro de "Reabilitacao de Credito", o usuario vera um painel completo para gerenciar solicitacoes de limpeza de nome, identico a referencia enviada.

### Layout da tela

1. **Barra superior**: Seta voltar + filtros em chips: Todos (verde, ativo por padrao), Aberto, Em andamento, Finalizado
2. **Tres cards de status**:
   - **Aberto** (icone verde) - "Total enviado" + contagem + "Sem encerramento" + botao "+" para adicionar nomes
   - **Em andamento** (icone laranja/amarelo) - "Total em andamento" + contagem + "Sem atualizacao"
   - **Finalizado** (icone azul/roxo) - "Total finalizados" + contagem + "Sem atualizacao"
3. **Listas expansiveis**: Em andamento e Finalizado terao seta para expandir e ver a lista de nomes

### O que sera feito

1. **Banco de dados**: Criar tabela `limpa_nome_requests` para armazenar os nomes enviados pelo usuario, com status (aberto, em_andamento, finalizado)
2. **Componente novo**: `LimpaNomeView` com todo o layout do painel
3. **Dialog de adicionar**: Formulario simples para o usuario enviar um novo nome (campo nome + CPF/documento)
4. **Integracao na pagina Servicos**: Quando o usuario clicar em "Limpa Nome", abrir essa view em vez de nao fazer nada

---

### Detalhes tecnicos

**Migracao SQL - Nova tabela:**

```sql
CREATE TYPE limpa_nome_status AS ENUM ('aberto', 'em_andamento', 'finalizado');

CREATE TABLE public.limpa_nome_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  person_name text NOT NULL,
  document text,
  status limpa_nome_status NOT NULL DEFAULT 'aberto',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.limpa_nome_requests ENABLE ROW LEVEL SECURITY;

-- Usuarios veem apenas seus proprios pedidos
CREATE POLICY "Users can view own requests"
  ON public.limpa_nome_requests FOR SELECT
  USING (auth.uid() = user_id);

-- Usuarios podem inserir pedidos
CREATE POLICY "Users can insert own requests"
  ON public.limpa_nome_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins podem gerenciar todos
CREATE POLICY "Admins manage all requests"
  ON public.limpa_nome_requests FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
```

**Novos arquivos:**

- `src/components/servicos/LimpaNomeView.tsx` — Componente principal com:
  - Filtros em chips (Todos / Aberto / Em andamento / Finalizado)
  - Tres cards de status com contagens dinamicas do banco
  - Listas expansiveis (Collapsible) nos cards Em andamento e Finalizado
  - Botao "+" no card Aberto para abrir dialog de adicionar

- `src/components/servicos/AddNomeDialog.tsx` — Dialog com formulario:
  - Campo "Nome completo"
  - Campo "CPF/Documento" (opcional)
  - Botao enviar que insere na tabela `limpa_nome_requests`

**Arquivos a modificar:**

- `src/pages/Servicos.tsx` — Adicionar estado `selectedItemId`, e quando o item clicado for "Limpa Nome", renderizar o `LimpaNomeView` em vez da lista de items
- `src/components/servicos/ServiceItemCard.tsx` — Tornar os cards clicaveis (adicionar prop `onClick`)

### Fluxo de navegacao

```text
Servicos -> Reabilitacao de Credito -> Limpa Nome -> Painel com cards de status
                                                      |
                                                      +-> Botao "+" abre dialog para adicionar nome
                                                      +-> Seta nos cards expande lista de nomes
```

