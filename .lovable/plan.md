
# Carteira funcional -- conectar ao backend real

## O que vai mudar para voce

- O saldo exibido sera o saldo **real** calculado pelo backend (entradas menos saidas)
- O historico mostrara transacoes reais do banco de dados, nao dados falsos
- Ao solicitar o saque, o valor **sai imediatamente do saldo** e aparece como "Pendente" no historico
- O saque cria um registro real que aparece na fila de auditoria do painel financeiro
- Usuarios novos verao saldo zerado
- Para sua conta de teste, vamos inserir creditos que somem R$ 249,90

## Fluxo do saque (como voce descreveu)

```text
1. Usuario clica "Sacar" -> escolhe valor no slider -> confirma
2. Backend valida saldo, cria withdrawal_request com status "pending"
3. Frontend recarrega dados -> saldo ja diminuiu, saque aparece como "Pendente" no historico
4. Financeiro ve na fila de auditoria -> Aprova ou Recusa
5. Se aprovado: debito registrado no wallet_transactions
6. Se recusado: saldo volta ao normal
```

## Dados de teste para sua conta

Inserir 4 creditos na tabela `wallet_transactions` para o usuario `7ae14bba-...` totalizando R$ 249,90:

| Descricao | Valor | source_type |
|---|---|---|
| Comissao - Paulo Silva | 120.00 | commission |
| Comissao - Lucas Mendes | 60.00 | commission |
| Comissao - Camila Santos | 45.00 | commission |
| Bonus de ativacao | 24.90 | bonus |

## Detalhes tecnicos

### 1. `src/pages/Carteira.tsx` -- reescrever com dados reais

- Remover todo mock data (array de transacoes, saldo fixo `249.9`)
- Ao montar, chamar `rpcUntyped("get_my_wallet")` para obter saldo real, transacoes e saques pendentes
- Mapear resposta do backend para o formato `Transaction[]`:
  - `wallet_transactions.type = 'credit'` -> `entrada`
  - `wallet_transactions.type = 'debit'` -> `saida`, status `aprovado`
  - `withdrawal_requests.status = 'pending'` -> `saida`, status `pendente`
  - `withdrawal_requests.status = 'approved'` -> ignorar (ja tem o debit correspondente)
  - `withdrawal_requests.status = 'rejected'` -> `saida`, status `rejeitado`
- Combinar tudo em lista unica ordenada por data
- `handleWithdrawSubmit` passa a ser `async`: chama `rpcUntyped("create_withdrawal_request", { p_gross_amount, p_pix_key })`
  - Se sucesso: recarrega `get_my_wallet` (saldo ja diminuiu, pendente aparece)
  - Se erro: mostra toast com a mensagem do backend
- Mostrar skeleton enquanto carrega

### 2. `src/components/carteira/WithdrawDialog.tsx` -- ajustar para async

- Alterar tipo do `onSubmit` para retornar `Promise<void>`
- Adicionar estado `submitting` com loading no botao
- Se o pai (Carteira) rejeitar a promise, manter o dialog aberto para o usuario ver o erro

### 3. Seed data via migration

- Inserir 4 registros de credito em `wallet_transactions` para o usuario admin

### Arquivos alterados
- `src/pages/Carteira.tsx`
- `src/components/carteira/WithdrawDialog.tsx`
- Nova migration SQL (seed data)
