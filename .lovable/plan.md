

## Integrar API cpfcnpj.com.br para validacao de CPF e CNPJ

### API escolhida: cpfcnpj.com.br

- **CPF**: Pacote 1 (CPF A) - retorna nome completo - R$ 0,17/consulta - SEM data de nascimento
- **CNPJ**: Pacote 4 (CNPJ A) - retorna razao social - R$ 0,15/consulta
- Endpoint: `GET https://api.cpfcnpj.com.br/{token}/{pacote}/{cpfcnpj}`
- Autenticacao por token (sem restricao de IP)
- Contratacao minima: R$ 10 no plano Premium (creditos nao expiram)

### O que voce precisa fazer antes

1. Criar conta em cpfcnpj.com.br
2. Comprar creditos dos pacotes CPF A (pacote 1) e CNPJ A (pacote 4)
3. Gerar o token de integracao no painel (menu API > Tokens)
4. Informar o token quando solicitado pelo sistema

### Implementacao

**1. Salvar token como segredo no backend**
- Sera solicitado o token da API para armazenamento seguro

**2. Criar funcao backend `hubdev-document-lookup`**
- Recebe tipo (cpf/cnpj) e numero do documento
- CPF: chama `https://api.cpfcnpj.com.br/{token}/1/{cpf}` (pacote 1 = CPF A)
- CNPJ: chama `https://api.cpfcnpj.com.br/{token}/4/{cnpj}` (pacote 4 = CNPJ A)
- Valida matematicamente antes de gastar creditos
- Retorna nome completo (CPF) ou razao social (CNPJ)

**3. Atualizar validacao no cliente (`validateCpfClient.ts`)**
- Substituir chamadas diretas a APIs brasileiras por chamada a funcao backend
- Remover SCPA, BrasilAPI, ReceitaWS
- Uma unica funcao que chama o backend para ambos os tipos

**4. Remover campo de data de nascimento (nao necessario)**
- A API CPF A nao exige data de nascimento

### Fluxo do usuario

```text
Usuario digita CPF (11 digitos) ou CNPJ (14 digitos)
  -> Validacao matematica local
  -> Se valido: chama backend -> backend chama cpfcnpj.com.br
  -> CPF: nome completo preenchido automaticamente
  -> CNPJ: razao social preenchida automaticamente
```

### Arquivos a criar/modificar

- `supabase/functions/hubdev-document-lookup/index.ts` (criar) - funcao backend que chama a API com o token seguro
- `src/lib/validateCpfClient.ts` (atualizar) - chamar o backend em vez de APIs diretas
- `src/components/servicos/AddNomeView.tsx` (sem mudanca significativa) - ja tem o fluxo de debounce e auto-preenchimento funcionando

### Detalhes tecnicos

**Funcao backend:**
```text
POST /hubdev-document-lookup
Body: { type: "cpf" | "cnpj", document: "12345678901" }

-> Valida matematicamente
-> Chama GET https://api.cpfcnpj.com.br/{CPFCNPJ_TOKEN}/{pacote}/{document}
   - pacote 1 para CPF, pacote 4 para CNPJ
-> Retorna { valid: true/false, name: "Nome Completo" ou "Razao Social" }
```

**Resposta da API (CPF A):**
- `status`: 1 (sucesso) ou 0 (erro)
- `nome`: nome completo do titular

**Resposta da API (CNPJ A):**
- `status`: 1 (sucesso) ou 0 (erro)
- `razao_social`: razao social da empresa

### Resultado esperado

- **CPF**: Usuario digita CPF -> nome completo aparece automaticamente (sem pedir data de nascimento)
- **CNPJ**: Usuario digita CNPJ -> razao social aparece automaticamente
- Token protegido no backend
- Custo por consulta: R$ 0,15 a R$ 0,17

