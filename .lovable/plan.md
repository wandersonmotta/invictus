
Objetivo (o que você pediu)
- Na área de “Aguardando aprovação” você quer que o “acesso limitado” seja percebido na prática: mesmo com status **Pendente**, o usuário já deve conseguir preencher **foto (circular)**, **bio**, **expertises** e **região**.
- Isso deve funcionar com o acesso atual: usuários pendentes continuam bloqueados do resto do sistema, mas conseguem editar o próprio perfil.

Diagnóstico (por que hoje não aparece “na prática”)
- O bloqueio já existe e funciona via `src/auth/RequireAuth.tsx`: usuários `pending` só podem entrar em `/perfil`, `/aguardando-aprovacao`, `/reset-password`, `/auth`.
- Porém o `/perfil` está apenas “placeholder” (não há formulário nem upload), então o usuário não vê esse acesso limitado “útil”.

Solução proposta (alto nível)
1) Criar os campos faltantes no backend (tabela `profiles`) para persistir bio, expertises e região.
2) Criar um bucket de armazenamento para avatar e políticas seguras para cada usuário só escrever/ler seu próprio arquivo.
3) Implementar o formulário completo de perfil em `/perfil` (funcionando também para pendentes).
4) Melhorar a tela `/aguardando-aprovacao` para:
   - deixar claro que o acesso é limitado
   - dar um CTA para “Completar perfil” (e opcionalmente mostrar um resumo do perfil ali).

Parte 1 — Backend (estrutura de dados)
A) Alterações na tabela `public.profiles` (migração)
- Adicionar colunas:
  - `bio` (text, null)
  - `region` (text, null)
  - `expertises` (text[] com default vazio) OU (se preferir mais simples) `expertises_text` (text) armazenando CSV.
Recomendação: `expertises text[]` para ficar mais estruturado.

B) Armazenamento do avatar (bucket + políticas)
- Criar bucket `avatars` (recomendação: público = true, por simplicidade de exibição no frontend).
- Regras/políticas para `storage.objects`:
  - Permitir que o usuário autenticado faça upload/update/delete apenas em caminhos que comecem com `auth.uid()/...` dentro do bucket `avatars`.
  - Permitir leitura pública (se bucket for público) ou leitura autenticada (se bucket for privado).
- Importante: o banco NÃO vai guardar o arquivo. Só vamos salvar em `profiles.avatar_url` a URL do avatar (ou `avatar_path` se quisermos usar path + getPublicUrl). Hoje já existe `avatar_url` na tabela.

Parte 2 — Frontend (Perfil editável com acesso limitado)
Arquivos principais a alterar/criar (frontend)
- Alterar: `src/pages/Perfil.tsx`
- Alterar (leve): `src/pages/AguardandoAprovacao.tsx`
- (Opcional) Criar componente reutilizável: `src/components/profile/ProfileForm.tsx` para usar tanto no Perfil quanto em AguardandoAprovacao, evitando duplicação.

Funcionalidades no `/perfil`
1) Carregar dados do perfil do usuário logado
- Buscar em `profiles` (via `supabase.from("profiles")`) os campos:
  - `display_name`, `avatar_url`, `bio`, `region`, `expertises`, `access_status`
- Usar `maybeSingle()` para não quebrar se ainda não existir (a app já cria um perfil mínimo no `AuthProvider`, mas mantemos robustez).

2) Formulário com validação
- Usar `react-hook-form` + `zod` (já instalados) para validar:
  - display_name: string opcional, máx. 60
  - bio: string opcional, máx. 500–800
  - region: string opcional, máx. 80
  - expertises: lista de strings (máx. 10), cada uma máx. 40
- UI:
  - `Input` para Nome e Região
  - `Textarea` para Bio
  - Expertises:
    - opção simples e rápida: um `Input` com “separe por vírgula”
    - opção melhor: chips (adicionar/remover) — posso fazer com o que já temos (sem lib extra)

3) Avatar circular + upload
- Mostrar avatar em formato circular usando `src/components/ui/avatar.tsx` (já é `rounded-full`).
- Upload:
  - `<input type="file" accept="image/*">` com validação de tamanho (ex.: 2–5MB) e tipos comuns (png/jpg/webp).
  - Ao selecionar arquivo:
    - fazer upload para o bucket `avatars` no caminho `${user.id}/avatar.<ext>` (ou com timestamp para cache-busting).
    - obter URL pública e salvar em `profiles.avatar_url`.
- Performance:
  - Redimensionar no cliente NÃO é obrigatório agora (mantemos simples). Se você quiser, depois adicionamos compressão client-side.

4) Feedback de “Acesso limitado”
- Se `access_status !== 'approved'`, mostrar um banner no topo do Perfil:
  - “Seu acesso está pendente. Você pode completar seu perfil, mas outras áreas permanecem bloqueadas até aprovação.”
- Assim o usuário entende o “limitado” de forma clara.

Funcionalidades no `/aguardando-aprovacao`
- Manter a mensagem de status.
- Adicionar botão/CTA:
  - “Completar perfil” -> link para `/perfil`
- (Opcional) Mostrar um card com um resumo (ex.: nome/region/expertises) e avatar atual, para reforçar que “já dá para configurar”.

Parte 3 — Segurança e regras de acesso (importante)
- Não vamos alterar a lógica de bloqueio geral: `RequireAuth` continuará impedindo acesso às outras rotas enquanto pendente.
- A tabela `profiles` já tem RLS:
  - “Users can update own profile”
  - “Users can view own profile”
  - “Admins can view/update all profiles”
- Ao adicionar colunas novas em `profiles`, essas políticas continuam válidas (não precisamos criar novas políticas para elas).
- Para o avatar, as políticas do bucket garantem que:
  - cada usuário só consegue escrever/alterar arquivos dentro da própria pasta (prefixo do próprio user_id).
  - ninguém consegue sobrescrever avatar alheio.

Etapas de implementação (sequência)
1) Conferir schema atual (já vimos que `profiles` tem `display_name` e `avatar_url`, falta bio/region/expertises).
2) Criar migração:
   - adicionar colunas na `profiles`
   - criar bucket `avatars`
   - criar políticas de storage para `avatars`
3) Atualizar `/perfil`:
   - query para carregar dados
   - form com validação + salvar em `profiles`
   - upload de avatar + salvar `avatar_url`
4) Atualizar `/aguardando-aprovacao`:
   - CTA para `/perfil`
   - (opcional) preview/resumo do perfil
5) Teste end-to-end:
   - Logar com usuário pendente:
     - consegue entrar em `/aguardando-aprovacao` e `/perfil`
     - consegue salvar bio/region/expertises
     - consegue subir avatar e ver circular
     - continua bloqueado nas demais rotas (redireciona para aguardando)
   - Logar com usuário aprovado:
     - mantém acesso total e o perfil continua editável

Detalhes técnicos (para referência)
- Upload (ideia de path):
  - Bucket: `avatars`
  - Path: `${user.id}/avatar-${Date.now()}.jpg`
  - Depois de upload, obter URL pública e gravar em `profiles.avatar_url`.
- Expertises:
  - Se for `text[]`: no submit, normalizar (trim, remover vazios, limitar a 10).
  - Se for CSV: salvar `expertises_text` e no load split por vírgula. (Menos ideal, mas mais simples.)

Pequena confirmação (não bloqueante, mas ajuda a acertar rápido)
- “Região” você quer como: “Cidade/UF” em um campo só? (Vou implementar assim para ser simples e rápido.)

Quando você aprovar este plano, eu implemento:
- Migração do backend (novas colunas + bucket + políticas)
- Formulário completo em `/perfil` com avatar circular
- CTA em `/aguardando-aprovacao` para completar perfil
