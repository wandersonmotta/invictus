

## Plano de Correção: Branding "Invictus Financeiro" no Desktop

### Problema Identificado

A screenshot mostra claramente:
1. O logo "INVICTUS" está ocupando quase toda a largura da sidebar (w-64 = 256px)
2. O texto "FINANCEIRO" está transbordando para fora da sidebar, sobrepondo o conteúdo principal
3. A altura do logo (`h-8` = 32px) mantém a proporção original, resultando em largura excessiva

### Causa Raiz

O arquivo `INVICTUS-GOLD_1.png` é uma imagem horizontal larga (logo completo "INVICTUS" com lettering). Ao definir `h-8`, a largura proporcional ultrapassa o espaço disponível na sidebar.

### Solução Proposta

Reorganizar o header da sidebar para empilhar verticalmente o logo e o texto "FINANCEIRO", similar ao padrão de branding usado em outras telas (landing, auth, wait screen).

```text
Antes (problematico):
+----------------------------------+
| [INVICTUS====] FINANCEIRO        |  <- Horizontal, transborda
+----------------------------------+

Depois (corrigido):
+----------------------------------+
|          [INVICTUS]              |  <- Logo centralizado
|          FINANCEIRO              |  <- Texto abaixo
+----------------------------------+
```

### Alteracoes no Arquivo

**Arquivo:** `src/components/financeiro/FinanceiroLayout.tsx`

**Mudancas no header da sidebar desktop (linhas 33-38):**

1. Mudar layout de `flex items-center gap-3` para `flex flex-col items-center justify-center`
2. Aumentar altura do header de `h-16` para `h-20` ou `h-24` para acomodar o layout vertical
3. Reduzir altura do logo para `h-6` para caber horizontalmente na sidebar de 256px
4. Mover texto "FINANCEIRO" para baixo do logo
5. Aplicar estilo metalico dourado no texto (similar ao "FRATERNIDADE" do app principal)

**Codigo atualizado:**

```tsx
<div className="flex h-20 flex-col items-center justify-center gap-1.5 border-b border-border px-4">
  <img 
    src={invictusLogo} 
    alt="Invictus" 
    className="h-6 w-auto shrink-0" 
  />
  <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
    Financeiro
  </span>
</div>
```

### Resultado Esperado

1. Logo INVICTUS centralizado horizontalmente na sidebar
2. Texto "FINANCEIRO" abaixo do logo, tambem centralizado
3. Nenhum elemento transbordando para fora da sidebar
4. Visual limpo e consistente com a identidade Invictus
5. Layout desktop funcional em notebooks e monitores

