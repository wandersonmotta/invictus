
Objetivo
- Criar uma landing page pública em “/” com a identidade INVICTUS (dark, dourado, clean, luxuosa) usando seus textos (manifesto completo + pilares + “o que encontra aqui” + rodapé).
- Manter a área de membros protegida (login obrigatório) e ajustar a navegação para que, após login, o usuário caia na área logada (ex.: “/app”).
- Implementar o CTA principal como “Lista de espera” (form de e-mail) salvando no backend com segurança (qualquer pessoa pode enviar, ninguém consegue listar/ler).

O que existe hoje (rápido diagnóstico)
- “/” hoje é a Home logada (dentro de RequireAuth + AppLayout).
- Sidebar aponta “Home” para “/”, então trocar “/” para landing pública exige mover a Home logada para outra rota.
- “/auth” já está com o visual premium (invictus-auth-page + invictus-auth-frame + FRATERNIDADE).
- Não existe ainda uma landing pública nem um fluxo de captura de leads (lista de espera).

Decisões já confirmadas
- Landing page em “/” (pública).
- CTA principal: Lista de espera.
- Conteúdo: Manifesto completo + Pilares em cards + O que encontra aqui + Rodapé simples.

Implementação (Frontend)
1) Rotas (separar landing pública de área logada)
- Alterar `src/App.tsx` para:
  - `"/"` → Landing pública (nova página)
  - `"/app"` (ou nome equivalente) → Home de membros (atual `src/pages/Home.tsx`) dentro de `<RequireAuth><AppLayout>...</AppLayout></RequireAuth>`
- Ajustar qualquer rota/redirect que hoje “cai em /” após login:
  - Em `src/pages/Auth.tsx`, mudar o `from` padrão de `"/"` para `"/app"` para evitar que o usuário logado seja mandado para a landing por padrão.
  - Opcional (recomendado): se o usuário já estiver logado e acessar “/”, redirecionar automaticamente para “/app” (para não confundir “logado vendo landing”).

2) Sidebar / navegação interna da área de membros
- Alterar `src/components/AppSidebar.tsx`:
  - Item “Home” (atualmente “/”) passará a ser “/app”.
  - O resto permanece igual.
- Isso garante que o menu lateral continue abrindo a “Home de membros”, não a landing.

3) Nova página de Landing (UI + copy INVICTUS)
- Criar uma nova página, por exemplo `src/pages/Landing.tsx`, usando:
  - Fundo cinematográfico já existente (mesma imagem do auth) para manter identidade.
  - Seções com bastante respiro, tipografia elegante e detalhes em dourado (GoldHoverText, bordas suaves, gradientes discretos).
- Estrutura sugerida (primeira versão):
  a) Topbar (pública)
   - Logo + “FRATERNIDADE” (mesmo padrão do /auth).
   - Ações à direita:
     - Secundário: “Entrar” → /auth
     - (opcional) “Tenho um convite” → /auth (pode abrir o modal do convite já na página de auth se quisermos evoluir depois)
  b) Hero (acima da dobra)
   - Headline forte com seus primeiros statements:
     - “Não é um grupo. Não é um produto. Não é para todos.”
     - Destaque: “INVICTUS é uma decisão.”
   - Subheadline curta amarrando a proposta.
   - CTA principal: formulário da lista de espera (e-mail + botão).
  c) Seção “O que é a Fraternidade Invictus” (manifesto)
   - Conteúdo do seu texto, com formatação premium (blocos curtos, destaques em frases-chave).
  d) Seção “Pilares” (4 cards)
   - Disciplina acima de talento
   - Execução acima de discurso
   - Resultado acima de opinião
   - Verdade acima de ego
  e) Seção “O que você encontra aqui” (cards)
   - Estrutura real de crescimento
   - Tecnologia como base
   - Inteligência Artificial própria
   - Ecossistema de negócios
   - Oportunidades concretas
   - Pessoas que jogam no modo sério
  f) Seções “Quem deve fazer parte” e “Quem não deve”
   - Duas colunas (desktop) / empilhado (mobile), com bullets fortes.
  g) Seção “Liderança” + “Regra de permanência” + “Essência Invictus”
  h) “Aviso final” (home killer)
   - Em bloco destacado, com contraste e presença.
  i) Rodapé simples
   - Nome/identidade + link “Entrar” e um contato simples (podemos deixar placeholder se você ainda não quer expor redes).

4) Consistência de estilo (dark/gold/class)
- Reutilizar classes existentes quando possível:
  - `invictus-auth-page` como base do fundo (ou criar uma classe “invictus-landing-page” se precisarmos de ajustes específicos para scroll e legibilidade).
  - Cards premium podem usar `invictus-auth-surface invictus-auth-frame` (ou variações mais leves para não “pesar”).
- Garantir:
  - Excelente contraste e legibilidade no texto longo do manifesto.
  - Layout responsivo (mobile-first).
  - CTA sempre visível/óbvio no hero.

Implementação (Backend – Lista de Espera)
5) Persistência segura dos leads
- Criar uma tabela (ex.: `waitlist_leads`) com campos:
  - `id` (uuid)
  - `email` (text, obrigatório)
  - `created_at` (timestamp default now)
  - `source` (text, opcional; ex.: “landing”)
  - `ip_hash` (text, opcional) para rate limit leve sem armazenar IP puro
- Regras de acesso (segurança):
  - Permitir INSERT público (qualquer visitante pode entrar na lista).
  - Bloquear SELECT/UPDATE/DELETE para visitantes e usuários comuns.
  - Leitura só para admins (se já existir um padrão de admin no projeto, seguimos o padrão atual).

6) Endpoint de cadastro (para validação + anti-abuso)
- Criar uma função de backend (ex.: `waitlist-signup`) que:
  - Recebe e valida o e-mail.
  - Normaliza (trim/lowercase).
  - Faz upsert/ignora duplicados (para não gerar spam de múltiplos cadastros iguais).
  - Aplica rate limit simples (ex.: por IP hash + janela de tempo) para reduzir abuso.
  - Retorna mensagem genérica de sucesso (sem vazar se o e-mail já existia).

7) Integração na Landing
- No submit do formulário:
  - Loading state no botão.
  - Toast de sucesso “Você entrou na lista de espera” (mensagem neutra).
  - Limpar input.
  - Em caso de erro: toast “Não foi possível. Tente novamente”.

Checklist de QA (end-to-end)
- Landing:
  1) Acessar “/” deslogado: ver landing completa, fundo, seções, CTA funcionando.
  2) Mobile: checar que texto longo continua legível (sem ficar “miúdo”).
- Lista de espera:
  3) Enviar e-mail válido → sucesso.
  4) Enviar e-mail inválido → mensagem de erro.
  5) Enviar o mesmo e-mail repetido → comportamento consistente (sem expor duplicidade).
- Autenticação / área de membros:
  6) Clicar “Entrar” → /auth.
  7) Logar com sucesso → redireciona para “/app”.
  8) Sidebar “Home” abre “/app”.
  9) Usuário logado acessando “/” → redireciona para “/app” (se ativarmos essa regra).

Arquivos que provavelmente serão criados/alterados
- Alterar:
  - `src/App.tsx` (rotas)
  - `src/components/AppSidebar.tsx` (Home → /app)
  - `src/pages/Auth.tsx` (redirect padrão pós-login para /app)
- Criar:
  - `src/pages/Landing.tsx`
  - (opcional) `src/components/landing/*` para organizar seções (se o arquivo ficar grande)
- Backend:
  - Nova migração SQL para `waitlist_leads` + políticas de acesso
  - Nova função de backend `waitlist-signup` (para validação/rate limit)

Observações para próxima etapa (personalização)
- Assim que essa primeira landing estiver no ar, você pode me mandar:
  - frases finais que você quer como headline/subheadline,
  - links oficiais (Instagram/WhatsApp/site),
  - se a lista de espera deve disparar e-mail automático (confirmação) ou apenas armazenar no backend,
  - se haverá página “Aplicar/Ser convidado” separada.
