

## Objetivo
Criar um sistema para visualizar, gerenciar e exportar os leads da lista de espera, integrado ao painel Admin existente.

---

## Análise do Cenário Atual

### O que já existe:
- Tabela `waitlist_leads` no banco com campos: email, full_name, phone, source, ip_hash, created_at
- Política RLS que permite apenas admins lerem os dados
- Página Admin (`/admin`) com 4 abas: Aprovações, Convites, Categorias, Treinamentos
- Edge function `waitlist-signup` que insere os leads

### O que falta:
- Aba no Admin para visualizar os leads
- Funcionalidade de exportar para Excel/CSV
- (Opcional) Acesso externo para compartilhar com terceiros

---

## Solução Proposta

### Opção Recomendada: Aba no Painel Admin + Exportação

Esta é a opção mais **prática e segura**:

1. **Nova aba "Leads"** no painel Admin existente
2. **Tabela com os leads** mostrando: Nome, WhatsApp, E-mail, Origem, Data
3. **Botão "Exportar CSV"** para baixar em formato Excel-compatível
4. **Busca/filtro** por nome ou email
5. **Ordenação** por data (mais recentes primeiro)

### Sobre Acesso Externo

Existem duas abordagens:

| Opção | Prós | Contras |
|-------|------|---------|
| **A) Link público temporário** | Fácil compartilhar | Menos seguro, precisa de token/expiração |
| **B) Criar mais admins** | Mais seguro, controle granular | Precisa criar conta para cada pessoa |

**Recomendação**: Começar com a aba no Admin + exportação CSV. Se precisar compartilhar, você pode:
- Exportar o CSV e enviar por email/WhatsApp
- Ou adicionar mais pessoas como admin no sistema

---

## Implementação Técnica

### 1) Modificar `src/pages/Admin.tsx`

**Adicionar nova aba "Leads"** (será a 5ª aba):

```text
Tabs: Aprovações | Convites | Categorias | Treinamentos | Leads
```

**Query para buscar leads**:
```typescript
const { data: waitlistLeads } = useQuery({
  queryKey: ["waitlist_leads"],
  enabled: !!isAdmin,
  queryFn: async () => {
    const { data, error } = await supabase
      .from("waitlist_leads")
      .select("id, email, full_name, phone, source, created_at")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  }
});
```

**Tabela de exibição**:
- Colunas: Nome | WhatsApp | E-mail | Origem | Data
- Formatação do telefone: (11) 99999-9999
- Formatação da data: dd/mm/yyyy HH:mm

**Funcionalidade de exportação CSV**:
```typescript
const exportToCSV = () => {
  const headers = ["Nome", "WhatsApp", "Email", "Origem", "Data"];
  const rows = waitlistLeads.map(lead => [
    lead.full_name || "",
    formatPhone(lead.phone),
    lead.email,
    lead.source || "",
    new Date(lead.created_at).toLocaleString("pt-BR")
  ]);
  
  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(","))
    .join("\n");
  
  // Download automático
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `leads-waitlist-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
};
```

**Busca/filtro**:
- Input de texto para filtrar por nome ou email
- Filtro client-side (os dados já estão carregados)

---

## Arquivos a Modificar

### `src/pages/Admin.tsx`
- Adicionar tipo `WaitlistLead`
- Adicionar query `waitlist_leads`
- Adicionar estado para busca
- Adicionar função `exportToCSV`
- Adicionar função `formatPhone` (formatar número brasileiro)
- Adicionar nova aba "Leads" no TabsList (5 colunas)
- Adicionar conteúdo da aba com tabela e botões

---

## Comportamento Esperado

1. Você acessa `/admin` como admin
2. Aparece a nova aba **"Leads"**
3. Vê a lista de todos os interessados com nome, WhatsApp, email, origem e data
4. Pode **buscar** por nome ou email
5. Pode clicar em **"Exportar CSV"** para baixar o arquivo
6. O arquivo CSV abre perfeitamente no Excel

---

## Layout da Aba Leads

```text
┌─────────────────────────────────────────────────────────┐
│  Leads da Lista de Espera                               │
│  Pessoas interessadas que preencheram o formulário      │
├─────────────────────────────────────────────────────────┤
│  [🔍 Buscar por nome ou email...    ]  [📥 Exportar CSV]│
├─────────────────────────────────────────────────────────┤
│  Nome          │ WhatsApp       │ Email         │ Data  │
│  João Silva    │ (11) 99999-9999│ joao@email... │ 31/01 │
│  Maria Santos  │ (21) 98888-8888│ maria@emai... │ 30/01 │
│  ...           │ ...            │ ...           │ ...   │
└─────────────────────────────────────────────────────────┘
```

---

## Checklist de Validação

- [ ] Nova aba "Leads" aparece no painel Admin
- [ ] Tabela mostra todos os leads ordenados por data (mais recentes primeiro)
- [ ] Busca filtra corretamente por nome ou email
- [ ] Botão "Exportar CSV" baixa arquivo válido
- [ ] Arquivo CSV abre corretamente no Excel
- [ ] Telefone formatado corretamente: (11) 99999-9999
- [ ] Apenas admins conseguem ver os dados (RLS já configurado)

---

## Próximos Passos (após implementação)

1. Testar preenchendo o formulário da landing
2. Verificar se o lead aparece na aba
3. Testar a exportação CSV
4. Se precisar de acesso externo, posso implementar sistema de link compartilhável

