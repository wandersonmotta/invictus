
# Limpar tickets de suporte de teste

## O que sera feito
Apagar todos os registros de teste do sistema de suporte:
- **4 tickets** na tabela `support_tickets`
- **8 mensagens** na tabela `support_messages`

## Ordem de execucao
1. Primeiro apagar as mensagens (dependem dos tickets)
2. Depois apagar os tickets

## Como
Usando o comando DELETE direto no banco de dados, sem filtro (apaga todos os registros de ambas as tabelas).
