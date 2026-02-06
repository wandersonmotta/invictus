

# Serviços e Produtos

Nova seção no sistema para exibir serviços e produtos organizados por categorias. O cadastro inicial sera feito diretamente pelo banco de dados (admin), e os membros aprovados poderao visualizar o catalogo.

---

## O que sera criado

### 1. Banco de dados — duas tabelas novas

**service_categories** (categorias de servicos/produtos)
- id, name, description, icon_name, sort_order, active, created_at

**service_items** (servicos e produtos dentro de cada categoria)
- id, category_id (FK para service_categories), name, description, price, price_label (ex: "a partir de R$"), image_url, contact_info, active, sort_order, created_at

Ambas com RLS: leitura para membros aprovados, gerenciamento total para admins.

### 2. Pagina /servicos

Uma pagina nova com:
- Lista de categorias (cards)
- Ao clicar numa categoria, exibe os itens (servicos/produtos) daquela categoria
- Cada item mostra nome, descricao, preco (se houver) e imagem (se houver)
- Botao "Voltar" para retornar a lista de categorias

### 3. Navegacao

Adicionar "Servicos" em todos os pontos de navegacao:
- **Sidebar desktop** (AppSidebar.tsx) — nova secao ou dentro de uma existente
- **Menu mobile** (MobileMenuSheet.tsx) — mesma posicao
- **Rotas** (HostRouter.tsx) — rota /servicos protegida com RequireAuth + AppLayout

### 4. Icone

Usar o icone `ShoppingBag` do lucide-react para representar Servicos.

---

## Detalhes tecnicos

### Migracao SQL

```sql
CREATE TABLE public.service_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  icon_name text,
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved can view active categories" ON public.service_categories
  FOR SELECT USING (is_approved() AND active = true);

CREATE POLICY "Admins manage categories" ON public.service_categories
  FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE TABLE public.service_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.service_categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price numeric,
  price_label text,
  image_url text,
  contact_info text,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.service_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved can view active items" ON public.service_items
  FOR SELECT USING (is_approved() AND active = true);

CREATE POLICY "Admins manage items" ON public.service_items
  FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
```

### Arquivos a criar
- `src/pages/Servicos.tsx` — pagina principal
- `src/components/servicos/ServiceCategoryCard.tsx` — card de categoria
- `src/components/servicos/ServiceItemCard.tsx` — card de item

### Arquivos a modificar
- `src/components/AppSidebar.tsx` — adicionar item "Servicos"
- `src/components/mobile/MobileMenuSheet.tsx` — adicionar item "Servicos"
- `src/routing/HostRouter.tsx` — adicionar rota /servicos

### Dados iniciais
Apos criar as tabelas, inserir a primeira categoria "Servicos e Produtos" para voce comecar a popular com itens.
