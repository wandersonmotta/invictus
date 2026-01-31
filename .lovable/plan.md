
Contexto (o que está acontecendo)
- Você publicou e, ao clicar em “Entrar” na landing no domínio raiz, a tela “pisca” com branco e não chega no subdomínio.
- Pelo seu relato e pelo fato de no painel de domínios existir “Primary domain” definido, o sintoma é extremamente compatível com um loop de redirecionamento entre domínios:
  - a landing tenta mandar para https://app.seudominio.com/auth
  - mas a plataforma redireciona o subdomínio de volta para o domínio “Primary”
  - o frontend detecta que não está no app host e tenta mandar de novo para o app host
  - isso vira um loop (pisca/tela branca) e “parece” que não direciona.

Causa provável (alta confiança)
- O projeto está com 2 domínios conectados (root + app), porém o “Primary domain” está ligado.
- Quando um domínio é “Primary”, os outros podem ser redirecionados automaticamente para ele.
- Para o seu caso (root = landing e app = app), você NÃO quer que um redirecione pro outro pela camada de domínio; você quer que ambos “sirvam o projeto” e o app decida o que mostrar com base no hostname (HostRouter).

Objetivo do ajuste
- Root (invictusfraternidade.com.br e/ou www) deve sempre servir a landing e, se tentar /auth, /admin, /app etc., redirecionar para app.* via nosso HostRouter.
- App (app.invictusfraternidade.com.br) deve servir o app/auth e nunca redirecionar automaticamente para o root por causa de “Primary domain”.
- Eliminar o loop e o “piscar” na navegação do “Entrar”.

Plano de correção (sem mexer no código primeiro)
1) Corrigir a configuração de Domínios no painel (passo crítico)
1.1) Desmarcar/remover “Primary domain”
- Vá em: Settings → Domains.
- Se existir um domínio marcado como Primary:
  - Remova o Primary (deixe “sem Primary”).
- Resultado esperado:
  - Tanto invictusfraternidade.com.br quanto app.invictusfraternidade.com.br passam a servir o mesmo projeto “direto”, sem redirecionamento automático entre eles.

1.2) Validar status e DNS/SSL do subdomínio app
- Confirme que o status do app.* está “Active”.
- Confirme que o app.* tem SSL (abre em https sem aviso).
- Se o app.* ainda estiver propagando/verificando, aguarde a ativação antes de testar novamente.

2) Testes obrigatórios pós-configuração (para confirmar que o loop acabou)
2.1) Teste no domínio raiz (landing)
- Acesse: https://invictusfraternidade.com.br/
- Clique “Entrar”
- Esperado:
  - Abrir https://app.invictusfraternidade.com.br/auth diretamente (sem piscar/loop).

2.2) Teste de acesso direto (anti-loop)
- Cole no navegador:
  - https://invictusfraternidade.com.br/auth
  - https://invictusfraternidade.com.br/admin
- Esperado:
  - Redireciona para o app.* mantendo o path (auth/admin).
  - /admin no app deve aplicar as regras:
    - deslogado: vai para /auth
    - logado não-admin: vai para /perfil
    - admin: entra no admin

2.3) Teste no app host
- Acesse: https://app.invictusfraternidade.com.br/
- Esperado:
  - Vai para /app (e se deslogado, o RequireAuth manda para /auth).

3) Diagnóstico técnico (caso ainda falhe após tirar o Primary)
Se depois de desmarcar o Primary ainda houver “pisca”/tela branca:
3.1) Coletar evidências rápidas
- Abrir o DevTools (F12) e me mandar:
  - Console (erros)
  - Network: qual URL fica alternando (root ↔ app)
- Eu também vou:
  - Ler logs do console e requisições (para identificar loop e origem exata)
  - Confirmar se algum link/redirect está indo para http em vez de https (pode gerar comportamento estranho)

3.2) Ajuste de código (apenas se necessário)
- Hoje, o código já está desenhado para:
  - não dividir por subdomínio em *.lovable.app (preview)
  - dividir em domínio customizado (root vs app)
- Mas se persistir, os ajustes típicos seriam:
  - Garantir que todo “redirect cross-domain” use sempre https no domínio customizado (evita downgrade para http).
  - Garantir que RedirectToApp preserve search/hash e não dispare repetidamente.
  - Opcional: colocar um “guard” anti-loop (ex.: se já está tentando navegar para app.* e recebeu de volta root com o mesmo path em menos de X segundos, parar e exibir uma mensagem de diagnóstico).

O que eu preciso de você (para concluir com 100% de certeza)
- Faça o passo 1.1 (remover Primary domain) e me diga se o “pisca/tela branca” parou ao clicar em “Entrar”.
- Se ainda falhar, me diga exatamente qual URL aparece na barra quando pisca (se alterna entre root e app), e eu preparo o plano de correção de código com base nesse comportamento.

Critério de “feito”
- Clicar “Entrar” no root abre app.* /auth imediatamente.
- Digitar /admin manualmente nunca exibe Admin para não-admin (e respeita: deslogado → /auth, logado não-admin → /perfil).
- Sem loop, sem tela branca piscando.
