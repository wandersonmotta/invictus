
Objetivo
- Deixar o e-mail de recuperação com a mesma “pegada” do site (clássico, robusto, sofisticado, luxuoso, detalhes dourados) e reduzir chance de cair no spam.
- Fazer um novo teste técnico + disparo real para o seu e-mail (wanderson.lealofc@icloud.com) depois das mudanças.

O que dá para melhorar (importante alinhar expectativa)
- Cair no spam é muito mais “configuração de domínio” (SPF/DKIM/DMARC, reputação, alinhamento do remetente) do que “layout bonito”.
- Mesmo com um template perfeito, se o domínio invictusfraternidade.com.br ainda não estiver 100% alinhado no provedor de e-mail, iCloud/Gmail podem mandar para spam.
- Então vamos atacar os 2 lados:
  1) Template/estrutura (o que controlamos no código).
  2) Entregabilidade/DNS (o que você ajusta no provedor do seu domínio e no Resend).

O que está no código hoje (diagnóstico rápido)
- A tela /auth chama `resetPassword()` (src/auth/AuthProvider.tsx), que invoca a função de backend `send-password-reset`.
- A função `send-password-reset` (supabase/functions/send-password-reset/index.ts) gera um link de recovery e envia via Resend um HTML “ok”, mas ainda simples.
- Ela atualmente envia apenas `html` (não envia versão `text`), e não inclui logo/identidade visual completa.

Plano de implementação (mudanças que vou fazer quando você aprovar)
1) Melhorar o template do e-mail (luxo/robusto + “mais profissional para filtros antispam”)
   1.1) Melhorias visuais (mantendo compatibilidade de e-mail)
   - Adicionar “top bar” com acabamento dourado (linha/gradiente discreto).
   - Adicionar um bloco de “selo”/assinatura (INVICTUS FRATERNIDADE) com tipografia mais premium.
   - Aumentar hierarquia visual: título, subtítulo, botão “dourado” com borda e sombra sutil.
   - Rodapé com texto institucional e contexto (reduz aparência de phishing): “Você recebeu isto porque solicitou recuperação de senha…”.
   - Preheader invisível (texto “prévia” que aparece no inbox): ex. “Link seguro para redefinir sua senha (expira em breve)”.

   1.2) Melhorias técnicas para reduzir spam (sem perder segurança)
   - Enviar também a versão `text` (plain text) junto do `html` no `resend.emails.send({ text, html })`.
     - Isso melhora compatibilidade e pontuação em filtros.
   - Garantir conteúdo “menos spammy”:
     - Evitar excesso de CAPS, excesso de símbolos, e CTA muito agressivo.
     - Assunto mais “institucional” (podemos manter “Redefinir sua senha”, mas com preheader melhor).
   - Incluir um rodapé com informações estáveis (nome da marca + motivo do e-mail).
   - Manter o link completo visível (já existe) e manter o botão com link igual ao link textual.

2) Incluir a marca (logo) no e-mail de forma correta
   Por que isso precisa de um passo extra:
   - Em e-mails, imagens precisam estar em uma URL pública; não dá para usar `src/assets/...` direto.

   2.1) Infra mínima (uma vez só)
   - Criar um bucket público “email-assets” no armazenamento do backend.
   - Criar uma policy de leitura pública apenas para esse bucket (somente SELECT).

   2.2) Upload do logo do projeto
   - Usar um asset que já existe no projeto (provável: `src/assets/invictus-logo.png` ou `src/assets/INVICTUS-GOLD_1.png`).
   - Fazer upload para `email-assets/logo.png`.
   - Checar o tamanho do arquivo:
     - Se > 500KB: vou te avisar e recomendar compressão (para evitar bloqueio/slow load em clients).
   - Referenciar no HTML com URL absoluta e cache-busting `?v=1`.

   2.3) Layout com fallback
   - Se o cliente bloquear imagens, o e-mail ainda precisa ficar bonito: manter o “brand header” em texto (INVICTUS FRATERNIDADE) e usar o logo como opcional.

3) Ajustar a experiência no /auth (opcional, mas recomendado)
   - Hoje o app sempre mostra “E-mail enviado…” mesmo que o provedor falhe (isso é correto por segurança).
   - Mas como agora já temos `accepted` sendo retornado pela função (no backend) e `resetPassword()` já expõe `accepted`, podemos:
     - Se `accepted === false`: mostrar “Serviço de e-mail temporariamente indisponível. Tente novamente em instantes.”
     - Se `accepted === true`: manter a mensagem atual (sem revelar se o e-mail existe).
   - Também adicionar um microtexto: “Se não chegar em 2 minutos, verifique Spam/Lixo eletrônico.”

4) Teste (técnico + disparo real)
   Depois das mudanças:
   - Rodar um teste direto na função de backend `send-password-reset` enviando para `wanderson.lealofc@icloud.com`.
   - Confirmar logs do backend com `send-password-reset: sent`.
   - Você confirma recebimento e se foi para inbox/spam no iCloud.

5) Checklist de entregabilidade (para sair do spam de verdade)
   Vou te orientar com um checklist claro (sem você precisar mexer em código), mas você precisará aplicar no seu provedor de domínio/Resend:
   - Verificar se o domínio `invictusfraternidade.com.br` está verificado no Resend.
   - Garantir que SPF e DKIM do domínio estejam publicados e “passando”.
   - Recomendado: configurar DMARC (mesmo que inicial “p=none” para monitorar).
   - Confirmar alinhamento do FROM:
     - `recuperaracesso@invictusfraternidade.com.br` deve ser do mesmo domínio autenticado.
   - Observação: reputação leva tempo; nos primeiros envios ainda pode cair em spam até “aquecer”.

Arquivos que serão alterados
- supabase/functions/send-password-reset/index.ts
  - Atualizar o HTML (novo template premium)
  - Adicionar `text` (plain text) no envio
  - Incluir logo via URL pública (após upload)
- src/pages/Auth.tsx (opcional, mas recomendado)
  - Usar `accepted` para mostrar “indisponível” quando o provedor estiver fora
  - Adicionar dica “verifique spam”

Mudanças no backend (banco/armazenamento)
- Criar bucket público `email-assets` + policy de SELECT pública (migração SQL).
- Upload do logo para esse bucket.

Critério de pronto
- O e-mail chega com visual “Invictus” (preto, dourado, sofisticado) e com logo.
- Existe versão texto do e-mail (para compatibilidade).
- O fluxo completo funciona: /auth → Esqueceu a senha → link → /reset-password → trocar senha → login.
- Entregabilidade: idealmente começa a aparecer no inbox; se ainda cair em spam, seguimos o checklist SPF/DKIM/DMARC.

<lov-actions>
<lov-suggestion message="Teste o fluxo completo /auth → Esqueceu a senha → abrir link → /reset-password → trocar senha → login, e confirme se foi para Inbox ou Spam no iCloud.">Verificar end-to-end</lov-suggestion>
<lov-suggestion message="Adicionar logo e identidade visual completa no e-mail de recuperação (bucket público email-assets + template premium + versão texto).">Personalizar e-mail (luxo)</lov-suggestion>
<lov-suggestion message="Ajustar a tela /auth para usar o campo accepted e mostrar 'serviço temporariamente indisponível' quando o provedor falhar (sem revelar se o e-mail existe).">Melhorar feedback no reset</lov-suggestion>
<lov-suggestion message="Criar uma página interna (admin) com checklist de entregabilidade (SPF/DKIM/DMARC) e status do remetente, para reduzir suporte quando cair em spam.">Checklist anti-spam</lov-suggestion>
<lov-suggestion message="Adicionar opção de reenviar link após X segundos e limitar tentativas para reduzir abuso e melhorar reputação do domínio.">Reenvio com rate limit</lov-suggestion>
</lov-actions>
