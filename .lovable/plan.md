
Objetivo
- Corrigir o erro “Perfil não encontrado” quando um usuário clica no perfil de outro usuário (ex.: pelo mapa/quick profile), garantindo que:
  - A rota `/membro/:username` sempre receba o `username` no formato esperado.
  - A tela `Membro.tsx` consiga interpretar tanto URLs com `@` quanto sem `@` (defensivo).
  - O fluxo “ver perfil → seguir → mensagem” funcione como combinado.

Diagnóstico (causa raiz mais provável)
- A página `src/pages/Membro.tsx` monta o username assim:
  - `const username = params.username ? \`@\${decodeURIComponent(params.username)}\` : ""`
- Em vários pontos do app, a navegação usa `/membro/${usernameSemArroba}` (correto).
- Porém, em `src/components/map/MemberQuickProfileDialog.tsx`, o botão “Ver perfil” está fazendo:
  - `navigate(\`/membro/\${p.username}\`)`
  - Onde `p.username` já vem sem o `@`? (em `MemberQuickProfileDialog` ela é exibida como `@{p.username}`, então `p.username` provavelmente é “joao.silva”)
  - Mas em outras partes do app o banco pode guardar com `@` (há memória do projeto dizendo que `profiles.username` é armazenado com “@”).
- Resultado: em alguns cenários o link vira `/membro/@joao.silva`. Ao chegar em `Membro.tsx`, ele faz `@ + "@joao.silva"` => `"@@joao.silva"`, e o RPC `get_public_profile_by_username` não encontra, exibindo “Perfil não encontrado.”

Escopo da correção (o que vou implementar)
1) Correção da geração do link no Quick Profile (mapa)
- Arquivo: `src/components/map/MemberQuickProfileDialog.tsx`
- Ajustar o `navigate` para sempre enviar o username sem `@` e com `encodeURIComponent`:
  - Ex.: `navigate(\`/membro/\${encodeURIComponent(p.username.replace(/^@/, ""))}\`)`
- Isso alinha o comportamento com `Buscar.tsx`, `FeedPostCard.tsx` e `NotificationBell.tsx`, que já normalizam.

2) Correção defensiva no parser da rota do perfil
- Arquivo: `src/pages/Membro.tsx`
- Atualizar a montagem do `username` para:
  - Aceitar `params.username` com ou sem `@`
  - Evitar duplicar `@`
  - Padronizar para o formato do backend (`@handle`) antes de chamar `get_public_profile_by_username`
- Comportamento desejado:
  - Se URL for `/membro/joao.silva` => usa `@joao.silva`
  - Se URL for `/membro/@joao.silva` => usa `@joao.silva` (sem duplicar)
  - Se URL vier com `%40` (encode do @) => também funciona.

3) Auditoria rápida de outros pontos de navegação
- Verificar rapidamente (por busca no código) se existe mais algum `navigate("/membro/" + username)` sem `.replace(/^@/,"")`.
- Corrigir onde necessário para manter consistência (especialmente componentes de mapa e notificações).

4) Testes práticos (preview + publicado)
- No preview:
  1. Entrar com usuário aprovado.
  2. Abrir Mapa → abrir o quick profile de um membro → clicar “Ver perfil”.
  3. Confirmar que o perfil abre (sem “Perfil não encontrado”).
  4. Testar “Seguir” e “Mensagem” na tela do perfil.
- No publicado:
  - Repetir os mesmos passos (principalmente clicar via mapa e via feed/busca).
- Teste de robustez:
  - Acessar manualmente no navegador:
    - `/membro/joao.silva`
    - `/membro/@joao.silva`
  - Confirmar que ambos abrem o mesmo perfil.

Risco/impacto
- Baixo risco: alterações isoladas no roteamento do perfil.
- Impacto positivo: elimina “Perfil não encontrado” causado por inconsistência de URL e torna a rota mais resiliente.

Critério de aceite
- Clicar no avatar/nome/@ em qualquer lugar do app abre o perfil correto.
- Não ocorre mais “Perfil não encontrado” por causa de URL com `@`.
- “Seguir” e “Mensagem” continuam funcionando na tela do perfil.

Arquivos envolvidos
- `src/components/map/MemberQuickProfileDialog.tsx` (corrigir link)
- `src/pages/Membro.tsx` (normalização defensiva do parâmetro `:username`)
- (Possivelmente) mais 1–2 arquivos se forem encontrados links inconsistentes em busca rápida.
