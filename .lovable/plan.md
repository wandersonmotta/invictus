
# Plano: Corrigir Layout do Card "Melhores Anúncios (Conversões)"

## Problema Identificado

Na sua tela de notebook, o card "Melhores Anúncios (Conversões)" está exibindo os nomes dos anúncios truncados (mostrando apenas "A" ou "C" em vez de "Ad 1", "Ad 2", etc.). Isso acontece porque:

1. O componente `DonutWithLegend` usa layout horizontal (donut à esquerda, legenda à direita)
2. Em telas menores/notebooks, o card fica estreito dentro do grid `lg:grid-cols-3`
3. O donut tem tamanho fixo (180px de altura/largura), deixando pouco espaço para a legenda
4. A propriedade `truncate` corta os nomes quando não há espaço

## Solução

Refatorar o layout do `DonutWithLegend` para ser responsivo:

1. **Layout adaptativo**: Em containers estreitos, colocar o donut em cima e a legenda embaixo (vertical)
2. **Reduzir tamanho do donut**: Quando em modo vertical ou container pequeno, diminuir proporcionalmente
3. **Garantir espaço mínimo para legenda**: Cada item da legenda deve ter espaço suficiente para exibir nome + porcentagem

## Mudanças Técnicas

### Arquivo: `src/components/leads/charts/DonutWithLegend.tsx`

```text
ANTES (layout horizontal fixo):
┌────────────────────────────────────┐
│ [DONUT 180px]  │ A 35%             │
│                │ ═══               │
│                │ A 28%             │
│                │ ═══               │
└────────────────────────────────────┘

DEPOIS (layout responsivo com fallback vertical):
┌────────────────────────────────────┐
│         [DONUT 120px]              │
│                                    │
│ ● Ad 1                        35%  │
│ ═══════════════════════════════    │
│ ● Ad 2                        28%  │
│ ═══════════════════════════════    │
│ ● Ad 3                        22%  │
│ ═══════════════════════════════    │
│ ● Outros                      15%  │
│ ═══════════════════════════════    │
└────────────────────────────────────┘
```

### Alterações específicas:

1. **Adicionar prop `layout`** com opção `"auto" | "horizontal" | "vertical"` (padrão: `"auto"`)
2. **Detectar espaço disponível** usando uma ref e ResizeObserver ou usar breakpoints CSS
3. **Ajustar tamanhos do donut** para ser menor em modo vertical (ex: 100-120px)
4. **Expandir área da legenda** para ocupar toda a largura disponível
5. **Remover truncate** do nome e usar layout que garanta visibilidade completa

### CSS/Classes a aplicar:

```tsx
// Container principal - muda de row para column em espaços pequenos
<div className={cn(
  "flex w-full min-w-0",
  layout === "vertical" ? "flex-col items-center gap-4" : "flex-row items-start gap-4"
)}>

// Legenda - ocupa largura total em modo vertical
<div className={cn(
  "space-y-2",
  layout === "vertical" ? "w-full" : "flex-1 min-w-0"
)}>

// Item da legenda - nome visível sem truncar
<span className="text-xs text-muted-foreground">
  {item.name}
</span>
```

## Uso no LeadsMetaView

O componente será chamado com `layout="vertical"` para garantir que sempre funcione:

```tsx
<DonutWithLegend
  data={mockBestAds}
  height={120}
  showPercentage
  layout="vertical"
/>
```

## Resultado Esperado

| Tela | Layout | Comportamento |
|------|--------|---------------|
| Desktop grande | Horizontal | Donut à esquerda, legenda à direita |
| Notebook/Desktop médio | Vertical | Donut em cima, legenda embaixo com nomes completos |
| Mobile | Vertical | Mesmo que notebook, responsivo |

## Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/components/leads/charts/DonutWithLegend.tsx` | Adicionar layout vertical responsivo |
| `src/components/leads/views/LeadsMetaView.tsx` | Passar `layout="vertical"` para o card de melhores anúncios |

## Testes a Realizar

1. Verificar em notebook (sua resolução atual)
2. Verificar em desktop 1920x1080
3. Verificar em tablet/mobile
4. Confirmar que todos os nomes aparecem completos com suas porcentagens e barras de progresso
