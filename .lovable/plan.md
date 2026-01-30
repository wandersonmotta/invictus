
Contexto do que você pediu (e o que eu vi no código atual)
- Hoje a landing (`src/pages/Landing.tsx`) renderiza `WaitlistHero` logo no topo (acima do Manifesto).
- O “Manifesto” e outras seções estão montados com vários `Card` (quadrados/caixas) em `src/components/landing/ManifestoSections.tsx`.
- A landing está usando a classe `invictus-auth-page`, que aponta para a imagem `/images/invictus-auth-bg.jpg` em `src/styles/invictus-auth.css`.
- O formulário de waitlist hoje captura somente `email` e chama a função de backend `waitlist-signup`, que insere em `waitlist_leads`.

Objetivo da próxima iteração
1) Tirar a lista de espera do topo: a captação vai para o final da página, com um botão “Quero fazer parte” que abre um formulário (modal).
2) Ajustar o formulário para 3 campos obrigatórios, na ordem:
   - Nome completo
   - WhatsApp (número de telefone)
   - E-mail
3) Melhorar a organização do texto (menos “quadrados”/cards; mais layout editorial, luxuoso, clean).
4) Trocar a imagem de fundo apenas da landing (não mexer em /auth e /reset-password):
   - Nova imagem: “visão do topo de um prédio em preto e branco com detalhes dourados”.

Plano de implementação (Frontend)
A) Estrutura da Landing (mover CTA para baixo)
- Arquivo: `src/pages/Landing.tsx`
  - Remover o `WaitlistHero` do topo.
  - Introduzir uma nova seção no final, antes do rodapé, algo como:
    - “Lista de espera” + texto curto + botão primário “Quero fazer parte”
    - Ao clicar, abre um modal (Dialog) com o formulário.

B) Novo componente de CTA no final + modal de formulário
- Arquivo: `src/components/landing/WaitlistHero.tsx` (provável refactor/renome conceitual)
  - Transformar o componente atual em algo mais alinhado ao que você quer:
    - Em vez de “hero com card”, virar “WaitlistSection” (seção no final) + “WaitlistDialog” (modal).
  - Reaproveitar o padrão de `Dialog` já existente (o projeto já estabiliza a posição para evitar “pular” quando aparecem erros).
  - Campos e validações (client-side) com zod + react-hook-form:
    - fullName:
      - obrigatório, trim
      - mínimo (ex.: 3) e máximo (ex.: 120)
      - opcionalmente bloquear números/símbolos excessivos (mantendo flexível para nomes compostos)
    - phone (WhatsApp):
      - obrigatório, trim
      - normalizar para dígitos (remover espaços, “( )”, “-”, etc.)
      - validar tamanho (ex.: 10 a 13 dígitos), aceitando DDD + número (e opcionalmente +55)
    - email:
      - obrigatório, trim, max 255, formato e-mail
  - UX:
    - Botão “Quero fazer parte” abre modal.
    - Submit com loading (“Enviando…”).
    - Toast de sucesso e fechar modal + reset do form.
    - Toast genérico de erro sem vazar detalhes.

C) Reorganizar o Manifesto para ficar “editorial” (sem ficar tudo em Card/quadrados)
- Arquivo: `src/components/landing/ManifestoSections.tsx`
  - Trocar a estrutura baseada em `Card` por blocos de texto com:
    - títulos claros
    - separadores sutis (ex.: linhas finas / gradientes discretos)
    - destaques pontuais com `GoldHoverText` (somente em frases-chave)
    - listas com bullets minimalistas (já existe `BulletList`, vamos manter mas com estética mais “luxo” e menos “UI box”)
  - Manter a responsividade:
    - desktop: duas colunas onde fizer sentido
    - mobile: tudo empilhado com respiro e leitura confortável
  - Resultado esperado: texto mais “manifesto”, com ritmo, menos “cards de produto”.

D) Novo fundo exclusivo da landing (sem afetar auth/reset)
- Arquivos:
  - `src/styles/invictus-auth.css` (ou outro arquivo de styles já usado) para adicionar uma nova classe, por exemplo:
    - `.invictus-landing-page { ... url("/images/invictus-landing-bg.jpg") ... }`
  - `src/pages/Landing.tsx`:
    - trocar `className="invictus-auth-page ..."` por `className="invictus-landing-page ..."`
- Gerar a imagem nova e colocar em `public/images/`:
  - Vamos gerar via o gerador de imagem (modelo “Nano banana”) um fundo P&B com detalhes dourados, com “cara de Invictus”.
  - Observação técnica importante: imagem como arquivo em `public/images/`, nunca no banco de dados.

Plano de implementação (Backend / Banco de dados)
E) Atualizar schema de `waitlist_leads` para aceitar os 3 campos
- Tabela atual: `public.waitlist_leads` tem apenas `email`, `source`, `ip_hash`, `created_at`.
- Vamos adicionar:
  - `full_name text`
  - `phone text`
- Como já existem registros antigos (apenas e-mail), para não quebrar nada:
  - adicionar colunas como NULLABLE primeiro
  - impor “obrigatoriedade” via:
    - validação na função de backend (sempre exigir os campos)
    - e endurecer a policy de INSERT (WITH CHECK) para exigir que `full_name` e `phone` não estejam vazios (e manter email regex).
  - (Opcional futuro) depois que você tiver certeza de que não precisa dos registros antigos incompletos, dá para migrar e tornar NOT NULL.

F) Atualizar a policy de INSERT (segurança + validação mínima no banco)
- Hoje a policy “Anyone can join waitlist” valida apenas o formato do e-mail.
- Vamos atualizar para algo do tipo:
  - email com regex (como já está)
  - full_name não vazio e dentro de um limite
  - phone não vazio e dentro de um limite
- Observação: a validação “real” (normalização de WhatsApp, etc.) fica no backend function; a policy faz só o mínimo para evitar lixo óbvio.

G) Atualizar a função de backend `waitlist-signup` para receber e salvar os campos
- Arquivo: `supabase/functions/waitlist-signup/index.ts`
  - Atualizar o payload para `{ full_name, phone, email, source }`.
  - Normalizar:
    - email -> trim + lowercase
    - full_name -> trim + colapsar espaços múltiplos (ex.: “João   Silva” -> “João Silva”)
    - phone -> manter apenas dígitos (e opcionalmente padronizar +55 se você quiser; por enquanto guardar dígitos é mais simples e robusto)
  - Validar server-side:
    - limites de tamanho
    - formato do e-mail
    - faixa de tamanho do telefone
  - Inserir no `waitlist_leads` com `full_name`, `phone`, `email`, `source`, `ip_hash`
  - Duplicidade:
    - continuar tratando email duplicado (unique lower(email)) como sucesso silencioso.

Checklist de QA (end-to-end) que eu vou seguir
1) Visual: abrir “/” (deslogado) e confirmar que:
   - fundo novo está aplicado só na landing
   - /auth e /reset-password continuam com o fundo antigo
2) Layout: confirmar que o manifesto está mais “limpo” (menos caixas) e com leitura boa no mobile.
3) Lista de espera:
   - rolar até o final, clicar “Quero fazer parte”, abrir modal
   - validar erros (campos vazios, telefone inválido, e-mail inválido)
   - enviar com dados válidos, receber toast de sucesso, fechar modal e limpar campos
4) Regressão: login /app continuam intactos.

Arquivos que serão alterados/criados (resumo)
- Alterar:
  - `src/pages/Landing.tsx` (tirar waitlist do topo; usar classe de fundo da landing; inserir seção final)
  - `src/components/landing/WaitlistHero.tsx` (refactor: virar seção final + modal + 3 campos)
  - `src/components/landing/ManifestoSections.tsx` (reorganização editorial; reduzir “quadrados”)
  - `src/styles/invictus-auth.css` (adicionar `.invictus-landing-page` apontando para nova imagem)
  - `supabase/functions/waitlist-signup/index.ts` (aceitar e persistir full_name + phone)
- Banco de dados (migração):
  - alterar `public.waitlist_leads` (adicionar colunas)
  - atualizar policy “Anyone can join waitlist” com checks mínimos

Notas rápidas de estilo (para ficar “select/luxo”)
- Em vez de “cards” para tudo:
  - usar colunas, separadores finos, e destaques curtos
  - reservar “moldura premium” apenas para trechos-chave (ex.: Aviso final e/ou CTA final)
- Manter “dark + dourado” com parcimônia, para não parecer “template”.

Depois que eu implementar, o próximo passo (se você quiser)
- Eu posso criar uma “página aplicar” (mais completa, com intenção/objetivo) separada da waitlist, mas por enquanto vamos manter a captação simples e direta como você descreveu.
