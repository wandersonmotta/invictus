
Contexto e decisão
- Você quer: não usar nada externo, sem API key, mas ainda assim ter “INVICTUS FRATERNIDADE” como nome + template no padrão do site e cair direto na caixa de entrada.
- Limitação prática: o envio “nativo” (padrão do sistema de autenticação) normalmente não permite controlar totalmente:
  - Nome exibido do remetente (“From name”)
  - Template/HTML do e-mail (botão, cores, identidade visual)
  - Entregabilidade (inbox vs spam) sem ajustar provedor/DNS/SMTP
- Portanto: para ter “INVICTUS FRATERNIDADE” + layout personalizado de forma confiável, a alternativa viável é continuar no fluxo customizado (Resend), que exige API key. Isso bate com sua escolha: “Continuar com Resend (recomendado)” e “prefiro esperar do que usar nativo sem personalizar”.

O que está acontecendo hoje (por que não chega)
- A UI sempre mostra “E-mail enviado…” mesmo quando falha (isso foi proposital para segurança: não revelar se um e-mail existe ou não).
- Quando o Resend está mal configurado (API key errada/ausente, ou “from” não permitido), o backend tenta enviar e falha — mas a tela continua mostrando sucesso.
- Já vimos anteriormente log do tipo “API key is invalid”. Isso normalmente significa:
  - RESEND_API_KEY vazia, incompleta, antiga, ou copiada errada
  - ou secret atualizada mas não é uma key válida do Resend
- Além disso, mesmo com API key OK, se o RESEND_FROM_EMAIL não for de um domínio verificado/permitido no Resend, o envio também falha (muitas vezes com erro de “from not verified / validation error”).

Estado atual do projeto (checado no código)
- O app hoje chama o reset assim:
  - src/auth/AuthProvider.tsx → resetPassword() → chama a função backend “send-password-reset”
- A função backend “send-password-reset”:
  - Gera link seguro de recuperação
  - Envia e-mail via Resend com “INVICTUS FRATERNIDADE”
  - Retorna sempre { ok: true } para o frontend mesmo em falha (segurança)
- Secrets existem no projeto:
  - RESEND_API_KEY
  - RESEND_FROM_EMAIL

Plano de execução (para fazer funcionar e você receber o e-mail)
1) Confirmar e corrigir os 2 inputs obrigatórios (sem isso não tem como enviar)
   1.1) RESEND_API_KEY
   - Você precisa criar uma API key no Resend (normalmente começa com “re_”).
   - Colar exatamente a key completa no secret RESEND_API_KEY (sem espaços, sem aspas extras).
   1.2) RESEND_FROM_EMAIL
   - Você vai definir um e-mail do seu domínio que está verificado no Resend (ex.: noreply@seudominio.com.br).
   - Atualizar o secret RESEND_FROM_EMAIL com esse e-mail.

2) Teste técnico controlado (para não ficar “no escuro”)
   - Vou disparar uma chamada de teste para a função “send-password-reset” e checar os logs do backend:
     - Se aparecer “send-password-reset: sent” → envio saiu do backend corretamente.
     - Se aparecer “resend_send_failed …” → ainda há problema de API key / from / domínio.
   - Esse teste não depende do front e elimina dúvidas de “o botão funcionou?”.

3) Melhorar o diagnóstico sem “explanar” dados sensíveis (ajuste de qualidade)
   - Ajustar a função “send-password-reset” para retornar um status técnico genérico (ex.: { ok: true, provider: 'resend', accepted: true/false }) SEM indicar se o e-mail existe.
   - Objetivo: quando o Resend estiver quebrado, o front pode mostrar “Serviço de e-mail temporariamente indisponível. Tente novamente em instantes.” em vez de sempre “E-mail enviado”.
   - Isso não revela se o usuário existe (continua seguro), só evita “falso positivo” quando o provedor está fora.

4) Ajuste fino de entregabilidade (para “cair na caixa de entrada”)
   - Mesmo com Resend, inbox depende do DNS:
     - SPF e DKIM do domínio precisam estar OK
     - DMARC recomendado
   - Se ainda cair em spam:
     - Ajustar assunto e conteúdo (mais curto, menos “promo-like”)
     - Evitar palavras/formatos que aumentam score de spam
     - Garantir alinhamento do “From” com domínio verificado

5) (Opcional) Fallback temporário
   - Se você quiser “não ficar sem reset enquanto arruma Resend”:
     - Criar modo híbrido: tenta Resend; se falhar por configuração, usa o nativo como fallback.
   - Observação: isso reintroduz o problema de nome/template no fallback. Você disse que prefere esperar a usar nativo sem personalizar, então só faremos se você pedir.

Dependências / o que preciso de você agora (não técnico, direto)
- Me diga qual e-mail você quer usar como remetente (RESEND_FROM_EMAIL), por exemplo:
  - noreply@seudominio.com.br
- E confirme que você vai gerar uma RESEND_API_KEY nova no Resend e colar aqui (a key é obrigatória; sem ela não existe envio personalizado).

Critérios de “funcionou”
- Você solicita “Esqueceu a senha?” em /auth
- Você recebe e-mail com remetente “INVICTUS FRATERNIDADE”
- Botão “Redefinir senha” aparece bem visível (dourado/alto contraste) e abre /reset-password
- Você consegue trocar a senha e logar com a nova senha

Riscos e limitações (importante alinhar expectativa)
- “Sem API externa” + “com branding total e entregabilidade controlada” não é realista: o envio nativo não dá esse nível de controle.
- Garantir 100% inbox em todos provedores nunca é promessa absoluta, mas com domínio bem configurado (SPF/DKIM/DMARC) e conteúdo correto, melhora muito.

Implementação (seção técnica — o que será alterado no código quando você aprovar esta próxima etapa)
- supabase/functions/send-password-reset/index.ts
  - Ajustar resposta para permitir UI mostrar indisponibilidade quando o envio falhar (sem revelar se o e-mail existe).
  - Melhorar logs e mensagens de erro (somente no backend).
- src/pages/Auth.tsx (ou manter como está)
  - Opcional: mostrar aviso “Se não chegar, verifique spam” e/ou “serviço temporariamente indisponível” quando o backend sinalizar falha técnica.
