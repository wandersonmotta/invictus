
# Plano: Editor de Avatar + Top Bar com Foto/Nome/Sair

## Resumo
Implementar (1) um **editor de recorte/posicionamento de avatar** com círculo de preview maior e salvar a imagem já cortada em formato quadrado; (2) dividir o campo "Nome" no perfil em **Nome** e **Sobrenome** (2 campos); (3) adicionar no **top bar** (AppLayout) a foto circular pequena, nome + sobrenome em dourado, e um **dropdown** ao clicar na foto com a opção "Sair" em dourado metálico.

---

## 1. Editor de Avatar (ProfileForm)

### Contexto atual
- Hoje: botão "Trocar foto" (clica → abre file input → upload direto).
- Avatar exibido em círculo de 64×64px (h-16 w-16).

### O que vamos fazer
1. **Aumentar o círculo de preview** para ~120×120px (h-30 w-30) para melhor visualização.
2. Quando usuário selecionar imagem, **abrir um Dialog** (modal "Invictus Glass") com:
   - Canvas de recorte circular (biblioteca `react-easy-crop` ou similar).
   - Zoom/posicionamento via slider e arrastar.
   - Botões "Cancelar" e "Salvar".
3. Ao clicar "Salvar":
   - Gerar **imagem recortada em formato quadrado** (ex.: 512×512px) via canvas.
   - Converter para Blob (JPG ou PNG).
   - Fazer upload para `avatars` (Supabase Storage).
   - Atualizar `profile.avatar_url`.

### Biblioteca sugerida
- `react-easy-crop` (já está instalada ou instalaremos).
- Lógica de crop → canvas → blob já testada em projetos Lovable.

### Arquivos modificados
- `src/components/profile/ProfileForm.tsx`: aumentar avatar, adicionar estado para modal + crop, função de salvar.
- Criar novo componente (opcional): `src/components/profile/AvatarCropDialog.tsx` (reuso em outros lugares).

---

## 2. Dividir "Nome" em 2 campos (Nome + Sobrenome)

### Contexto atual
- Tabela `profiles`: coluna `display_name text` (nome único).
- ProfileForm: input "Nome" (`display_name`).

### O que vamos fazer (backend)
1. **Migration SQL**:
   - Adicionar coluna `first_name text` (nome).
   - Adicionar coluna `last_name text` (sobrenome).
   - **Migração de dados**: popular `first_name` com a primeira palavra de `display_name`, e `last_name` com o restante (ou NULL se só tem 1 palavra).
   - Manter `display_name` por enquanto (legado/compatibilidade com funções existentes), mas passar a compor automaticamente: `first_name || ' ' || last_name`.
   - Criar trigger ou atualizar funções para que `display_name` seja sempre `concat(first_name, ' ', last_name)` ao salvar.
2. **Atualizar funções RPC** (se necessário):
   - `search_approved_members`, `find_approved_member_by_username`, `get_approved_member_pins`, `get_my_threads`: hoje retornam `display_name`; vamos continuar retornando `display_name` (computado).
   - Garantir que `display_name` seja sempre consistente com `first_name || ' ' || last_name`.

### O que vamos fazer (frontend)
1. **ProfileForm** (ProfileFormValues):
   - Trocar campo `display_name` por `first_name` e `last_name`.
   - Validação zod:
     - `first_name`: obrigatório, trim, max 30 caracteres.
     - `last_name`: obrigatório, trim, max 30 caracteres.
   - Ao carregar perfil: preencher inputs com `first_name` e `last_name`.
   - Ao salvar: enviar `first_name` e `last_name`; backend compõe `display_name`.
2. **Outros componentes**: não mudar nada (continuam lendo `display_name` das funções).

### Arquivos modificados
- Nova migration SQL: `supabase/migrations/<timestamp>_add_first_last_name.sql`.
- `src/components/profile/ProfileForm.tsx`: schema zod, inputs, lógica.
- `src/integrations/supabase/types.ts`: auto-atualizado (não editar).

---

## 3. Top Bar: Avatar + Nome + Menu "Sair"

### Contexto atual
- `src/components/AppLayout.tsx`: header com logo + texto "FRATERNIDADE".
- Não há perfil do usuário exibido.

### O que vamos fazer
1. **Buscar dados do usuário logado**:
   - Usar `useAuth()` para pegar `user.id`.
   - Criar hook ou query para buscar `profiles.first_name`, `profiles.last_name`, `profiles.avatar_url` do usuário logado.
   - Cache com TanStack Query (staleTime 60s).
2. **Layout do header** (AppLayout):
   - À **direita** do logo + "FRATERNIDADE", adicionar:
     - Avatar circular pequeno (32×32px).
     - Nome + Sobrenome em **dourado** (`text-primary`, efeito metálico via `GoldHoverText` ou classe customizada).
     - Ao clicar no avatar ou nome: abrir **Dropdown Menu** (Radix `DropdownMenu`).
3. **Dropdown** (conteúdo):
   - Item "Sair" com ícone `LogOut` (lucide).
   - Estilo dourado metálico (mesma cor de hover do GoldHoverText).
   - Ao clicar "Sair": chamar `signOut()` do `useAuth()`.

### Design visual (top bar)
- Fundo: `invictus-surface` + `backdrop-blur-xl` (como hoje).
- Separador inferior sutil (gradiente) mantido.
- Novo agrupamento à direita:
  - `<Avatar />` (h-8 w-8).
  - Texto nome (`<GoldHoverText>` ou `<span className="text-primary font-semibold">`)
  - Clicar em qualquer um abre menu.
- Menu dropdown: fundo `invictus-modal-glass`, item "Sair" com hover dourado.

### Arquivos modificados
- `src/components/AppLayout.tsx`: adicionar query de perfil, renderizar avatar + nome + dropdown.
- `src/components/ui/dropdown-menu.tsx`: já existe (Radix).
- Possível novo componente: `src/components/UserMenu.tsx` (reuso em vários layouts).

---

## Sequência de implementação

1. **Migration SQL** (first_name + last_name):
   - Criar migration.
   - Aguardar aprovação do sistema.
   - Testar no backend (perfil salva e `display_name` é computado).
2. **ProfileForm** (2 campos):
   - Atualizar schema zod.
   - Ajustar inputs.
   - Testar salvar e exibir.
3. **Editor de Avatar** (ProfileForm):
   - Instalar `react-easy-crop` (se necessário).
   - Criar modal de crop.
   - Aumentar círculo de preview.
   - Implementar lógica de crop → blob → upload.
   - Testar fluxo completo.
4. **Top Bar** (AppLayout):
   - Criar query para buscar perfil do usuário logado.
   - Adicionar avatar + nome à direita do logo.
   - Implementar dropdown "Sair".
   - Testar em desktop e mobile.

---

## Validações e segurança

- **RLS**: `profiles` já tem RLS; usuários podem atualizar apenas o próprio perfil.
- **Storage**: bucket `avatars` já é público; imagens recortadas seguem mesmo padrão de path (`userId/avatar-timestamp.ext`).
- **Crop**: toda lógica de recorte é client-side (canvas); imagem final enviada ao backend já cortada.
- **SQL**: trigger ou função para compor `display_name` a partir de `first_name || ' ' || last_name` garante consistência.

---

## Testes (critérios de aceite)

1. **Editor de Avatar**:
   - Usuário clica "Trocar foto" → modal abre com preview grande.
   - Pode arrastar/zoom na imagem.
   - Ao salvar, imagem é recortada em círculo e armazenada em formato quadrado.
   - Avatar atualiza no perfil e no top bar.
2. **Nome + Sobrenome**:
   - Formulário exibe 2 campos.
   - Ao salvar, backend compõe `display_name`.
   - Buscas e listagens continuam mostrando nome completo.
3. **Top Bar**:
   - Avatar pequeno + nome completo (dourado) aparecem à direita do logo.
   - Clicar no avatar abre dropdown com "Sair".
   - "Sair" funciona e desloga.
   - Layout responsivo (mobile: talvez esconder texto do nome e deixar só avatar + dropdown).

---

## Arquivos principais a modificar

- Backend:
  - `supabase/migrations/<nova_migration>.sql` (first_name, last_name, trigger/função para display_name).
- Frontend:
  - `src/components/profile/ProfileForm.tsx` (2 campos + editor de avatar).
  - `src/components/AppLayout.tsx` (top bar: avatar + nome + dropdown).
  - (Opcional) `src/components/profile/AvatarCropDialog.tsx` (modal de crop).
  - (Opcional) `src/components/UserMenu.tsx` (dropdown reutilizável).

---

## Riscos/cuidados

- **Display_name legado**: manter `display_name` como coluna computada (ou via trigger) garante que funções/views existentes continuam funcionando sem quebrar.
- **Crop de imagem**: biblioteca `react-easy-crop` pode adicionar ~30kb ao bundle; aceitável para a funcionalidade.
- **Mobile**: testar top bar em telas pequenas (avatar + nome pode ficar apertado; considerar esconder texto do nome em <640px e deixar só avatar + dropdown).

---

## Nota técnica (display_name)

Duas abordagens possíveis:
1. **Coluna computada** (Postgres 12+):
   ```sql
   ALTER TABLE profiles
     ADD COLUMN display_name text GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED;
   ```
2. **Trigger** (mais flexível):
   - Ao INSERT/UPDATE, preencher `display_name` com `first_name || ' ' || last_name`.

Recomendação: **coluna computada** (mais simples, sempre consistente).

---

Fim do plano. Arquivos a serem modificados:
- `supabase/migrations/<timestamp>_add_first_last_name.sql`
- `src/components/profile/ProfileForm.tsx`
- `src/components/AppLayout.tsx`
- `src/integrations/supabase/types.ts` (auto-atualizado)
