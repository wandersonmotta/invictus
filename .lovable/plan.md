
## Plano de Correção: Painel Financeiro

### Problemas Identificados

1. **Erro 404 ao clicar em "Histórico" e "Relatórios"**
   - A sidebar aponta para `/financeiro/historico` e `/financeiro/relatorios`
   - Essas rotas **não existem** no `HostRouter.tsx`
   - Apenas existem: `/financeiro/auth`, `/financeiro/dashboard` e `/financeiro/auditoria/:withdrawalId`

2. **Logo "INVICTUS" cortado na sidebar**
   - O logo é uma imagem com a palavra completa "INVICTUS"
   - O container do header tem apenas `h-16` e `justify-center`
   - O logo com `h-8` + texto "FINANCEIRO" não cabem bem lado a lado, causando corte no "I" inicial

3. **Navegação de volta do `AuditoriaDetalhe.tsx` incorreta**
   - Após aprovar/rejeitar, o código navega para `/dashboard` fixo
   - No preview Lovable, deveria ser `/financeiro/dashboard`

---

### Solucao Proposta

#### 1. Criar as paginas que faltam

Criar duas novas paginas placeholder:

**`src/pages/financeiro/FinanceiroHistorico.tsx`**
- Pagina de historico de auditorias (aprovados + rejeitados)
- Por enquanto, um placeholder com mensagem "Em breve"

**`src/pages/financeiro/FinanceiroRelatorios.tsx`**
- Pagina de relatorios financeiros
- Por enquanto, um placeholder com mensagem "Em breve"

#### 2. Adicionar as rotas no HostRouter

No bloco Lovable (preview):
```text
/financeiro/historico -> FinanceiroHistorico
/financeiro/relatorios -> FinanceiroRelatorios
```

No bloco financeiro subdomain (producao):
```text
/historico -> FinanceiroHistorico
/relatorios -> FinanceiroRelatorios
```

#### 3. Corrigir o layout da sidebar e header mobile

**Arquivo: `src/components/financeiro/FinanceiroLayout.tsx`**

Problemas a corrigir:
- Logo cortado: o container precisa de mais espaco horizontal
- Texto "FINANCEIRO" muito grande/largo em telas menores

Ajustes:
- Trocar `justify-center` por `justify-start` com padding lateral
- Reduzir o tracking do texto "FINANCEIRO" 
- Adicionar `shrink-0` no logo para nao comprimir
- Garantir que o container tem `min-w-0` e `overflow-hidden` se necessario
- No header mobile, aplicar os mesmos ajustes

#### 4. Corrigir navegacao do AuditoriaDetalhe

**Arquivo: `src/pages/financeiro/AuditoriaDetalhe.tsx`**

- Adicionar deteccao de ambiente (preview vs producao)
- Corrigir `navigate("/dashboard")` para usar o basePath correto
- Linhas afetadas: 131, 160, 176, 196

---

### Detalhes Tecnicos

```text
Novos arquivos:
- src/pages/financeiro/FinanceiroHistorico.tsx
- src/pages/financeiro/FinanceiroRelatorios.tsx

Arquivos a editar:
- src/routing/HostRouter.tsx (adicionar rotas)
- src/components/financeiro/FinanceiroLayout.tsx (corrigir layout)
- src/pages/financeiro/AuditoriaDetalhe.tsx (corrigir navegacao)
```

#### Layout Corrigido (FinanceiroLayout.tsx)

Header da sidebar:
```text
<div className="flex h-16 items-center gap-2 border-b border-border px-4">
  <img src={invictusLogo} alt="Invictus" className="h-6 shrink-0" />
  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
    Financeiro
  </span>
</div>
```

Principais mudancas:
- Logo menor: `h-6` (era `h-8`)
- Tracking reduzido: `tracking-wide` (era `tracking-wider`)
- Texto menor: `text-xs` (era `text-sm`)
- Flex com gap ao inves de margin: `gap-2` (era `ml-2`)
- Logo nao encolhe: `shrink-0`

---

### Resultado Esperado

1. Clicar em "Historico" abre pagina de historico (sem 404)
2. Clicar em "Relatorios" abre pagina de relatorios (sem 404)
3. Logo "INVICTUS" aparece completo na sidebar
4. Layout funciona tanto em desktop quanto em mobile/tablet
5. Navegacao de volta da auditoria funciona corretamente

---

### Proximos Passos (apos implementacao)

1. Testar todas as rotas do financeiro no preview
2. Testar o fluxo completo de auditoria (abrir item, aprovar/rejeitar, voltar)
3. Testar layout em diferentes tamanhos de tela
4. Implementar conteudo real nas paginas de Historico e Relatorios (futuramente)
