
Objetivo
- Remover o “azul oceano escuro” do tema e deixar um **preto grafite premium** (luxo, clean, sem ficar “preto pesado”), mantendo **dourado forte** e o estilo **glassmorphism mais intenso**, sem perder performance desnecessariamente.

Diagnóstico (por que está “azulado” hoje)
- O tom “oceano” vem diretamente dos tokens do tema em `src/index.css` dentro de `.dark`, principalmente:
  - `--background: 228 22% 6%`
  - `--card / --popover / --secondary` em torno de `230 ...%`
  - `--sidebar-background` também `228 22% 6%`
- Esses HSL com hue ~228/230 puxam para navy/azul.

Mudanças que vou implementar (tema)
1) Trocar os tokens escuros para “Grafite premium” (neutro, sem hue azul)
Arquivo: `src/index.css` (bloco `.dark`)
- Ajustar para HSL neutro (hue 0 e saturação 0) em todos os “fundos”:
  - `--background` → grafite bem escuro (ex.: `0 0% 6%` ou `0 0% 7%`)
  - `--card` / `--popover` → levemente acima do background para manter profundidade (ex.: `0 0% 10%`–`11%`)
  - `--secondary` / `--muted` → um degrau acima (ex.: `0 0% 14%`)
  - `--border` / `--input` → mais visível, porém discreto (ex.: `0 0% 18%`)
  - `--sidebar-background` → igual ao `--background` (para unificar o “100% dark”)
  - Atualizar também `--primary-foreground` e `--accent-foreground` para combinar com o novo preto (hoje eles herdam o tom azul do background).

2) Intensificar o glassmorphism (como você escolheu: “Intenso”), com cuidado de performance
Arquivo: `src/index.css`
- Ajustar o token:
  - `--glass` (na `.dark`) de `0.52` para algo mais “vidro” (mais transparência), por ex. `0.44`–`0.48`
  - Isso aumenta a sensação “glass” sem obrigatoriamente subir blur (que costuma pesar mais).
- Ajustar a superfície `.invictus-surface` para reforçar a percepção de luxo:
  - Manter `backdrop-filter: blur(18px)` por padrão (performance)
  - Opcional (se ficar leve no preview): aumentar muito levemente (ex.: 20px) ou aplicar blur maior apenas em telas maiores (desktop) para preservar mobile.

3) Afinar o “luxo” com contraste e leitura (sem estourar dourado)
- Conferir se textos `--foreground` e `--muted-foreground` continuam confortáveis no novo grafite (pode exigir leve ajuste no `--muted-foreground` para não “lavar” demais).
- Manter ouro atual (`--primary`, `--gold-soft`, `--gold-hot`) e só ajustar intensidades se o ouro ficar “neon” em cima do grafite.

Validação (o que você vai notar ao testar)
- Fundo geral do app e da tela /auth fica **neutro (sem azul)**, com aparência de grafite.
- Sidebar e área principal ficam no mesmo “preto premium”, com cards em um degrau acima (profundidade).
- Glassmorphism fica mais evidente (cards mais “vidro”) sem o tema perder legibilidade.
- Dourado continua sendo o acento principal e não muda de identidade.

Riscos e cuidados
- Glass mais intenso pode aumentar custo de renderização por blur/backdrop-filter em aparelhos fracos. Por isso:
  - Vou priorizar “mais glass” via transparência (`--glass`) e sombras (mais barato)
  - Só aumento blur se realmente necessário e, idealmente, de forma responsiva (desktop > mobile)

Arquivos que serão alterados
- `src/index.css` (tokens `.dark` + ajuste de `--glass` e possivelmente detalhes finos da `.invictus-surface`/`.invictus-frame`)

Checklist rápido pós-implementação
- Abrir `/auth` e uma página interna (com sidebar) e verificar:
  - Fundo sem azul
  - Card “glass” mais intenso
  - Contraste do texto (principal e muted)
- Verificar no mobile (largura pequena) se continua fluido (sem engasgos perceptíveis).

