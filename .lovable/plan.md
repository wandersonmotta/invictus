

## Nova pagina "Pagamentos" com abas Aprovados e Pendentes

### Resumo

Criar uma nova pagina `/pagamentos` posicionada na navegacao logo abaixo de "Buscar", com duas secoes: **Pagamentos Aprovados** e **Pagamentos Pendentes**. Os pagamentos pendentes mostram contagem regressiva de 30 minutos e permitem retomar o pagamento Pix. Apos expirar, somem da lista. Quando pagos, migram para a secao de aprovados.

### Nova tabela no banco de dados

Criar tabela `service_payments` para rastrear cada tentativa de pagamento:

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | uuid (PK) | Identificador |
| user_id | uuid | Dono do pagamento |
| service_type | text | Ex: "limpa_nome" |
| status | text | "pending", "approved", "expired" |
| amount_cents | integer | Valor em centavos |
| item_count | integer | Quantidade de itens |
| items_snapshot | jsonb | Dados dos nomes/itens (para exibicao) |
| payment_provider | text | Ex: "stripe", "mercadopago", etc |
| payment_external_id | text | ID do PaymentIntent/cobranca externo |
| pix_qr_code_url | text | URL da imagem do QR Code |
| pix_code | text | Codigo copia e cola |
| expires_at | timestamptz | Quando o Pix expira |
| paid_at | timestamptz | Quando confirmou pagamento |
| created_at | timestamptz | Criacao do registro |

RLS: usuario so ve/insere os proprios registros. Nao pode editar nem deletar diretamente.

### Fluxo de dados

```text
Usuario clica "Ir para pagamento"
        |
        v
Edge function cria o Pix (gateway a definir)
        |
        v
Registro salvo em service_payments (status=pending, expires_at=+30min)
        |
        v
PixPaymentView exibe QR Code + polling
        |
   +----+----+
   |         |
 Pagou    Expirou
   |         |
   v         v
status=    Sumiu da
approved   lista pendentes
```

### Arquivos a criar

**1. `src/pages/Pagamentos.tsx`**

Pagina principal com:
- Titulo "Pagamentos" no topo
- Secao "Pagamentos Aprovados" com contagem e lista de cards
- Secao "Pagamentos Pendentes" com contagem e lista de cards com countdown
- Cada card pendente mostra: nome do servico, quantidade de itens, valor, tempo restante, e botao "Pagar"
- Cada card aprovado mostra: nome do servico, quantidade, valor, data de confirmacao
- Query busca `service_payments` do usuario, filtra pendentes nao expirados e aprovados

**2. `src/components/pagamentos/PendingPaymentCard.tsx`**

Card individual de pagamento pendente com:
- Icone + nome do servico (ex: "Limpa Nome")
- Quantidade de itens e valor total
- Contagem regressiva em tempo real (mm:ss)
- Botao "Pagar" que abre o PixPaymentView com os dados salvos
- Quando o timer chega a zero, o card desaparece

**3. `src/components/pagamentos/ApprovedPaymentCard.tsx`**

Card individual de pagamento aprovado com:
- Icone de check + nome do servico
- Quantidade de itens e valor
- Data/hora da confirmacao

### Arquivos a modificar

**4. `src/components/AppSidebar.tsx`**

Adicionar "Pagamentos Pendentes" na secao "Inicio", logo abaixo de "Buscar", com icone `CreditCard` (ou `X` como na referencia).

**5. `src/components/mobile/MobileMenuSheet.tsx`**

Mesmo item de menu adicionado na mesma posicao.

**6. `src/routing/HostRouter.tsx`**

Adicionar rota `/pagamentos` dentro do `RequireAuth` + `AppLayout`.

**7. `src/App.tsx`**

Adicionar preloader para a pagina Pagamentos.

**8. `src/components/servicos/AddNomeView.tsx`**

Ao criar o pagamento (chamar a edge function), tambem salvar um registro em `service_payments` com status "pending" e os dados do Pix. Assim o pagamento aparece na pagina de Pagamentos Pendentes mesmo se o usuario sair da tela.

**9. `src/components/servicos/PixPaymentView.tsx`**

Ao confirmar pagamento (polling retorna sucesso), atualizar o registro em `service_payments` para status "approved" e `paid_at`.

### Detalhes tecnicos

- A contagem regressiva usa `expires_at` do banco vs `Date.now()`, atualizada a cada segundo via `setInterval`
- Pagamentos pendentes sao filtrados no frontend: `WHERE status = 'pending' AND expires_at > now()`
- A pagina usa `useQuery` com `refetchInterval: 30000` para capturar atualizacoes
- O botao "Pagar" em pagamentos pendentes reabre o `PixPaymentView` com `pix_qr_code_url`, `pix_code` e `payment_external_id` salvos no registro
- Apos aprovacao, o card migra automaticamente para a secao de aprovados no proximo refetch
- A migracao SQL inclui politicas RLS: SELECT e INSERT para `auth.uid() = user_id`, UPDATE restrito a colunas `status` e `paid_at`

