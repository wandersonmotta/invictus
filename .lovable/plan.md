

## Lista de nomes com remover (X), valor R$ 150/nome e fallback de validacao

### Resumo

Atualizar o card "Lista de nomes" para exibir cada nome individualmente com botao X para remover, valor fixo de R$ 150 por nome, e icone de pagamento no lugar do lapis. Sem botao de editar -- se errou, remove e cadastra de novo.

Tambem garantir que quando a API estiver sem creditos (fallback), o sistema aceita o documento com base na validacao matematica, apenas sem auto-preenchimento do nome.

### Mudancas no arquivo `src/components/servicos/AddNomeView.tsx`

**1. Listar cada nome individualmente no card**
- Cada item mostra o nome (em destaque) e o documento abaixo
- Botao X vermelho a direita para remover
- Numeracao sequencial (1, 2, 3...) como na referencia

**2. Remover nome ao clicar no X**
- Remove do estado local `addedNames`
- Deleta o registro da tabela `limpa_nome_requests` no banco

**3. Valor R$ 150 por nome**
- Trocar `addedNames.length * 0` por `addedNames.length * 150`
- Exibir valor formatado (R$ 150, R$ 300, R$ 450...)

**4. Trocar icone do valor**
- Substituir `Pencil` por `CreditCard` do lucide-react ao lado do valor

**5. Sem botao de editar**
- Nao adicionar funcionalidade de edicao. Se errou, remove (X) e cadastra novamente

### Mudanca no backend (fallback sem creditos)

O backend (`hubdev-document-lookup`) ja trata o caso de token ausente ou API falhando -- retorna `{ valid: true, name: null, fallback: true }`. O frontend ja aceita esse cenario (docStatus = "valid", sem auto-preenchimento). Nenhuma mudanca necessaria nessa parte.

### Layout da lista

```text
Lista de nomes

1. NOME COMPLETO DA PESSOA               [X]
   052.085.541-86

2. OUTRO NOME COMPLETO                   [X]
   044.057.751-92

Nomes: 2                    Valor: R$ 300
```

### Detalhes tecnicos

**Arquivo: `src/components/servicos/AddNomeView.tsx`**

- Importar `X` e `CreditCard` do lucide-react (remover `Pencil`)
- No card "Lista de nomes", mapear `addedNames` para exibir cada item com indice, nome, documento e botao X
- Ao clicar X: filtrar `addedNames` removendo o item e chamar `supabase.from("limpa_nome_requests").delete().eq("id", item.id)`
- Linha de resumo: `Nomes: {count}` e `Valor: R$ {count * 150}`
- Icone `CreditCard` no lugar de `Pencil`

### Arquivos modificados

- `src/components/servicos/AddNomeView.tsx` (unico arquivo)

