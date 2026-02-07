

## Pagamento Pix inline (sem redirecionamento ao Stripe)

### Resumo

Substituir o fluxo atual de redirecionamento ao Stripe Checkout por um fluxo inline onde o QR Code Pix e o codigo copia-e-cola sao exibidos diretamente dentro do app, sem abrir abas externas.

### Mudanca de abordagem

O fluxo atual usa **Checkout Sessions** (redireciona para uma pagina do Stripe). O novo fluxo usara **PaymentIntents** com confirmacao server-side, que retorna diretamente os dados do Pix (QR code + codigo) para renderizar no app.

```text
FLUXO ATUAL:
  Usuario clica "Ir para pagamento"
    -> Edge function cria Checkout Session
    -> Redireciona para stripe.com (nova pagina)
    -> Stripe mostra QR Pix
    -> Redireciona de volta ao app

NOVO FLUXO:
  Usuario clica "Ir para pagamento"
    -> Edge function cria PaymentIntent + confirma com Pix
    -> Retorna QR code (imagem) + codigo copia-e-cola + payment_intent_id
    -> App exibe tela inline com QR code e botao copiar
    -> App faz polling para verificar se pagou
    -> Ao confirmar, salva nomes e documentos
```

### O que sera modificado

**1. Edge function `create-limpa-nome-payment` (reescrever)**

Substituir a criacao de Checkout Session por PaymentIntent:

- Criar PaymentIntent com `payment_method_types: ["pix"]`, `confirm: true`, `payment_method_data: { type: "pix" }`, e `amount` calculado (150 x quantidade de nomes em centavos BRL)
- O PaymentIntent retornara `status: "requires_action"` com `next_action.pix_display_qr_code` contendo:
  - `image_url_svg` - imagem SVG do QR code
  - `image_url_png` - imagem PNG do QR code
  - `data` - string do codigo Pix (copia-e-cola)
  - `expires_at` - timestamp de expiracao
- Retornar esses dados ao frontend (em vez de uma URL de redirect)
- Continuar armazenando metadata com os nomes no PaymentIntent

**2. Edge function `verify-limpa-nome-payment` (adaptar)**

- Substituir a verificacao de Checkout Session por verificacao de PaymentIntent
- Receber `payment_intent_id` em vez de `session_id`
- Verificar `paymentIntent.status === "succeeded"`
- Recuperar nomes do metadata do PaymentIntent (mesma logica de chunks)
- Inserir registros no banco (mesma logica atual)

**3. Frontend `AddNomeView.tsx` (modificar)**

- Ao clicar "Ir para pagamento":
  - Serializar arquivos para sessionStorage (manter)
  - Chamar edge function `create-limpa-nome-payment`
  - Em vez de redirecionar, exibir nova tela inline com:
    - Imagem do QR code Pix (usando `image_url_png`)
    - Codigo copia-e-cola com botao de copiar (usando o campo `data`)
    - Timer de expiracao
    - Valor total
- Implementar **polling** a cada 3-5 segundos chamando `verify-limpa-nome-payment` para checar se o pagamento foi confirmado
- Ao confirmar:
  - Fazer upload dos documentos
  - Exibir mensagem de sucesso
  - Voltar para tela de servicos

**4. Pagina `PagamentoSucesso.tsx` (simplificar ou remover)**

- O fluxo de sucesso agora ocorre dentro do proprio `AddNomeView`, sem redirect
- A pagina `PagamentoSucesso.tsx` pode ser simplificada para um fallback caso o usuario acesse diretamente, ou removida

### Detalhes tecnicos

**Edge function `create-limpa-nome-payment` - novo corpo:**

```text
PaymentIntent.create({
  amount: names.length * 15000,    // R$ 150 por nome em centavos
  currency: "brl",
  payment_method_types: ["pix"],
  payment_method_data: { type: "pix" },
  confirm: true,
  metadata: { user_id, names (chunked) }
})
```

A resposta retornara:
```text
{
  payment_intent_id: "pi_xxx",
  pix_qr_code_url: "https://...(SVG ou PNG do QR)",
  pix_code: "00020126...(string Pix copia-e-cola)",
  expires_at: 1234567890
}
```

**Componente de pagamento inline (dentro de AddNomeView):**

- Estado `paymentData` com os dados do Pix recebidos
- Quando `paymentData` existe, renderizar tela de pagamento em vez do formulario
- QR code exibido como `<img src={pix_qr_code_url} />`
- Codigo copia-e-cola em campo de texto com icone de copiar (usa `navigator.clipboard.writeText`)
- Polling via `setInterval` a cada 4 segundos chamando verify
- Botao "Cancelar" para voltar ao formulario

**Polling de verificacao:**

- A cada 4 segundos, chamar `verify-limpa-nome-payment` com o `payment_intent_id`
- Se retornar sucesso: parar polling, fazer upload de docs, mostrar confirmacao
- Se Pix expirar (verificar `expires_at`): parar polling, mostrar mensagem de expiracao
- Limpar interval no unmount do componente

### Arquivos a modificar

1. `supabase/functions/create-limpa-nome-payment/index.ts` - Reescrever para usar PaymentIntent
2. `supabase/functions/verify-limpa-nome-payment/index.ts` - Adaptar para PaymentIntent
3. `src/components/servicos/AddNomeView.tsx` - Adicionar tela inline de Pix com QR code e polling
4. `src/pages/PagamentoSucesso.tsx` - Simplificar (fallback basico)

