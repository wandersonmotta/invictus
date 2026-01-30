
## Objetivo
Corrigir o “Esqueceu a senha?” para que o e-mail de redefinição:
- Chegue com mais confiabilidade (evitar spam o máximo possível)
- Venha com o nome correto **“INVICTUS FRATERNIDADE”** (não “INVICTUS-Connect”)
- Tenha um botão de “Redefinir senha” visível (não “apagado”/cinza)
- Mantenha a UX atual do /auth (não mexer no layout dourado do card)

Você confirmou:
- Está chegando no **spam**
- Quer **Enviar via Resend**
- Você **já tem domínio verificado**

## Diagnóstico (por que isso acontece hoje)
1) O fluxo atual usa o envio padrão do sistema de autenticação (`resetPasswordForEmail`).  
   - Dependendo da configuração do remetente/SMTP, os provedores (iCloud/Gmail/Outlook) podem jogar no spam.
2) O “nome errado” e o “botão apagado” normalmente vêm do template padrão do provedor (ou CSS do template) e como alguns clientes de e-mail interpretam estilos.
3) Para ter controle total (nome, HTML do e-mail, botão legível), precisamos enviar o e-mail nós mesmos via Resend, mas ainda usando o mecanismo seguro de recuperação do backend.

## Solução escolhida (Resend) — como vai funcionar
Vamos trocar o envio de “Esqueceu a senha?” para um fluxo customizado:

### A) Criar uma função de backend (Edge Function) para recuperação
Criar uma função (ex.: `send-password-reset`) que:
1. Recebe `{ email, redirectTo }` do app.
2. Usa uma chave privilegiada do backend (service role) para gerar um link de recuperação seguro via API Admin:
   - `auth.admin.generateLink({ type: 'recovery', email, options: { redirectTo } })`
   - Isso retorna um **action_link** pronto (com token) do jeito correto.
3. Envia um e-mail pelo Resend com:
   - From name: **INVICTUS FRATERNIDADE**
   - From email: algo do seu domínio verificado (ex.: `noreply@seudominio.com.br`)
   - Assunto e HTML premium, com botão preto/dourado bem legível e 100% inline styles (compatível com Gmail/iCloud/Outlook).
4. Segurança: retornar uma resposta “genérica” mesmo quando o e-mail não existir (para evitar enumeração de usuários):
   - Ex.: sempre responder 200 com “Se este e-mail existir, você receberá um link…”

### B) Atualizar o frontend para usar essa função no “Esqueceu a senha?”
Sem mexer no visual do card:
- Trocar a implementação do `resetPassword` (no `AuthProvider` ou diretamente na página `Auth.tsx`) para chamar:
  - `supabase.functions.invoke("send-password-reset", { body: { email, redirectTo } })`
- Manter a mesma mensagem atual de sucesso (genérica), para não expor se o e-mail existe ou não.

### C) Ajustes para entregabilidade (spam)
Mesmo com Resend, entregabilidade depende de DNS:
- Confirmar que o domínio no Resend está com **SPF** e **DKIM** ativos (e idealmente **DMARC**).
- Usar um remetente consistente: `noreply@seudominio...`
- Evitar HTML “pesado” (muito CSS, fontes externas). Tudo inline, simples e premium.

### D) Corrigir “botão apagado”
No HTML do e-mail:
- Botão como `<a>` com estilos inline (background sólido, cor do texto, borda) e fallback (texto com link por baixo).
- Evitar estilos que alguns clientes “desabilitam” (ex.: opacity baixa ou classes CSS não-inline).
- Garantir contraste e legibilidade.

## Arquivos/áreas que serão alterados
1) **Novo backend function**
- `supabase/functions/send-password-reset/index.ts`
  - Implementação com Resend + generateLink
  - CORS correto
  - Rate limit leve (se necessário) e logs úteis (sem expor tokens em logs)

2) **Config**
- `supabase/config.toml`
  - Adicionar a entrada da função com `verify_jwt = false` (e validar/filtrar no código se necessário)
  - Manter `project_id` na primeira linha (como exigido)

3) **Frontend**
- `src/auth/AuthProvider.tsx` (preferível) ou `src/pages/Auth.tsx`
  - Trocar `resetPasswordForEmail` por `functions.invoke("send-password-reset")`
  - Preservar UX e mensagens

## Segredos necessários (antes de implementar)
Vamos precisar adicionar no backend (secrets):
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL` (ex.: `noreply@seudominio.com.br`)
Opcional:
- `RESEND_FROM_NAME` (vamos usar “INVICTUS FRATERNIDADE”; se preferir configurável, vira secret também)

## Testes (o que eu vou validar)
1) No /auth → “Esqueceu a senha?”:
- Enviar para um e-mail real
- Confirmar que chega (inbox/spam) e com nome correto
2) Verificar conteúdo do e-mail:
- Assunto, remetente, botão bem visível
- Link abre e cai na rota `/reset-password` dentro do app
3) Fluxo completo:
- Definir nova senha na tela `/reset-password`
- Login com a nova senha
4) Compatibilidade:
- Checar em mobile (Gmail/iCloud) e desktop (Gmail web) ao menos

## Observações importantes
- Mesmo com Resend, pode cair no spam se o domínio não estiver 100% configurado (SPF/DKIM/DMARC). Como você já tem domínio verificado, isso tende a melhorar bastante.
- O e-mail será propositalmente “genérico” na resposta do app (segurança).
- Não vamos mexer no layout dourado do /auth.

## Entrega esperada
- E-mail de redefinição com branding “INVICTUS FRATERNIDADE”, botão funcionando e visível, maior chance de chegar no inbox.
- Fluxo de redefinição funcionando ponta-a-ponta dentro do app.
