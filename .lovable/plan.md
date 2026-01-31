

## Diagnóstico: Por que a imagem desaparece e recarrega no mobile

### Problema Identificado
O comportamento que você descreve (imagem sumindo ao rolar para cima e recarregando ao voltar) é causado por **comportamento agressivo de gerenciamento de memória** em navegadores móveis. O sistema atual tem alguns pontos que agravam isso:

### Causas Técnicas

1. **Imagens duplicadas no mesmo URL**
   - O `LandingBackground.tsx` carrega a imagem via `<img>` fixo
   - O `body.invictus-landing-body` no CSS também tenta carregar a **mesma imagem** como `background-image`
   - O `.invictus-landing-page` também carrega a imagem como background
   - Resultado: 3 tentativas de carregar a mesma imagem = confusão do browser

2. **Camadas CSS pesadas**
   - O overlay animado (`::after` com `invictus-grain-drift`) aplica múltiplos gradientes + blur + animação contínua
   - O `mix-blend-mode: overlay` força recomposição constante
   - Em mobile, o browser "descarrega" layers fixos para economizar memória

3. **Falta de hints de preload**
   - As imagens críticas não têm `<link rel="preload">` no HTML
   - O browser não prioriza corretamente

4. **Múltiplas camadas de gradientes**
   - Até 9 gradients empilhados no `body.invictus-landing-body`
   - Cada gradiente é uma camada de composição separada

---

## Solução: Otimização de Performance

### A) Simplificar o sistema de background (eliminar duplicação)

**Estratégia**: Usar APENAS o componente `LandingBackground.tsx` e remover as regras duplicadas do CSS.

Arquivos afetados:
- `src/styles/invictus-auth.css`: Remover `background-image` de `.invictus-landing-page` e `body.invictus-landing-body`
- `src/components/landing/LandingBackground.tsx`: Manter como fonte única da imagem

### B) Otimizar o overlay animado

**Antes**: Animação contínua de 12s com blur + múltiplos gradientes + mix-blend-mode
**Depois**: 
- Overlay estático (sem animação contínua)
- Remover `mix-blend-mode` (causa recomposição constante)
- Reduzir número de gradientes de 5 para 3

### C) Adicionar preload da imagem crítica

No `index.html`, adicionar:
```html
<link rel="preload" as="image" href="/images/invictus-landing-bg-1536x1920-v2.jpg" media="(max-width: 767px)">
<link rel="preload" as="image" href="/images/invictus-landing-bg-1920x1080-v2.jpg" media="(min-width: 768px)">
```

### D) Melhorar o LandingBackground

- Adicionar `fetchPriority="high"` na imagem
- Usar `will-change: transform` para promover a layer na GPU
- Simplificar overlays (menos gradientes)

### E) Otimizar gradientes do body principal

No `src/index.css`, simplificar os gradientes do body de 3 para 1 mais eficiente

---

## Arquivos a Modificar

### 1) `index.html`
- Adicionar `<link rel="preload">` para as imagens de background (responsivo)

### 2) `src/components/landing/LandingBackground.tsx`
- Adicionar `fetchPriority="high"`
- Adicionar `will-change: transform` no container
- Simplificar overlays

### 3) `src/styles/invictus-auth.css`
- Remover `background-image` duplicados de `.invictus-landing-page`
- Remover `background-image` duplicados de `body.invictus-landing-body`
- Simplificar/remover a animação `invictus-grain-drift`
- Remover `mix-blend-mode: overlay` do `::after`

### 4) `src/index.css`
- Simplificar gradientes do body

---

## Comportamento Esperado Após Otimização

1. **Imagem não some mais**: A imagem fica "pinned" na GPU e não é descarregada
2. **Scroll mais suave**: Menos camadas de composição = menos trabalho para o browser
3. **Carregamento mais rápido**: Preload garante que a imagem está pronta antes do render
4. **Memória reduzida**: Sem duplicação de imagens

---

## Detalhes Técnicos da Otimização

### Antes (pesado):
```css
/* 9 gradientes + imagem + animação + blend mode */
body.invictus-landing-body {
  background-image: ... 9 layers ...;
  animation: invictus-grain-drift 12s infinite;
}
.invictus-landing-page::after {
  mix-blend-mode: overlay;
  animation: invictus-grain-drift 12s infinite;
}
```

### Depois (leve):
```css
/* Sem background no body/page (usa apenas <img>) */
body.invictus-landing-body {
  /* Só overlay sutil, sem imagem */
}
/* Overlay estático, sem animação */
.invictus-landing-page::after {
  /* Gradientes simplificados, sem animation, sem mix-blend-mode */
}
```

---

## Checklist de Validação

- [ ] Imagem de fundo NÃO some ao rolar para cima no mobile
- [ ] Imagem NÃO recarrega ao voltar (scroll down)
- [ ] Scroll permanece suave
- [ ] Animações dos cards e ícones continuam funcionando
- [ ] Desktop mantém qualidade visual

---

## Próximos Passos

1. Implementar as mudanças
2. Testar no mobile (recarregar e rolar várias vezes)
3. Testar no desktop (verificar que visual premium se mantém)
4. Se necessário, ajustar intensidade dos overlays

