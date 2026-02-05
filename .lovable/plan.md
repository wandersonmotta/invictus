
# Plano: Corrigir Scroll Abrindo o Post Indevidamente no Mobile

## Problema Identificado

Quando o usuário arrasta o dedo sobre uma imagem/vídeo no feed para rolar a página, o evento `onTouchEnd` dispara e o post é aberto indevidamente. Isso acontece porque:

1. O código atual usa apenas `onTouchEnd` para detectar interações
2. Não há verificação se houve **movimento** entre o toque inicial e o final
3. Qualquer `touchEnd` está sendo tratado como um "tap", mesmo quando é um scroll

## Solução

Rastrear a posição inicial do toque (`onTouchStart`) e comparar com a posição final (`onTouchEnd`). Se o dedo se moveu mais do que um limite (ex: 10px), ignorar a interação pois é um scroll, não um tap.

## Mudanças Técnicas

### Arquivo: `src/components/feed/FeedPostCard.tsx`

1. **Adicionar refs para rastrear posição do toque:**
   ```
   touchStartRef = { x: number, y: number } | null
   ```

2. **Adicionar handler `onTouchStart`:**
   - Capturar coordenadas iniciais do toque (`touch.clientX`, `touch.clientY`)
   - Salvar em `touchStartRef`

3. **Modificar handler `onTouchEnd`:**
   - Capturar coordenadas finais do toque
   - Calcular a distância percorrida (deltaX, deltaY)
   - Se distância > 10px → ignorar (foi scroll)
   - Se distância ≤ 10px → processar como tap/double-tap

4. **Fluxo corrigido:**
```text
┌─────────────────────────────────────────────────────────────┐
│                    TOUCH START                              │
│              Salvar posição (x, y)                          │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    TOUCH END                                │
│           Calcular distância do movimento                   │
└─────────────────────────────────────────────────────────────┘
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
     Distância > 10px          Distância ≤ 10px
          │                         │
          ▼                         ▼
   IGNORAR (scroll)          Processar tap
                                    │
                      ┌─────────────┴─────────────┐
                      ▼                           ▼
              Double-tap?                   Single-tap
              (< 300ms)                     (após 300ms)
                  │                              │
                  ▼                              ▼
           Curtir + ❤️                    Abrir post
```

## Resultado Esperado

- Arrastar o dedo para rolar → página rola normalmente, post não abre
- Toque único rápido (sem movimento) → abre o post após 300ms
- Toque duplo rápido (sem movimento) → curte com animação do coração

