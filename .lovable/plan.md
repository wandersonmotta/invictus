

## Scrollbar Premium Invictus

A barra de rolagem atual e a padrao do navegador -- grossa, cinza, sem personalidade. Vamos substituir por uma scrollbar exclusiva Invictus: fina, dourada, luminosa, com um efeito de "luz" que acompanha o thumb conforme o usuario rola.

### O que sera feito

**Arquivo: `src/index.css`** -- adicionar estilos globais de scrollbar customizada

- Scrollbar ultra-fina (4px de largura) com track transparente
- Thumb (a "barrinha") com gradiente dourado usando as variaveis `--gold-soft` e `--gold-hot` ja existentes
- Glow luminoso dourado ao redor do thumb (box-shadow dourado)
- Hover: thumb fica levemente mais largo (6px) e o glow se intensifica
- Border-radius total para manter a forma arredondada e elegante
- Compatibilidade com WebKit (Chrome/Safari/Edge) e Firefox (`scrollbar-color`)
- Light mode: dourado mais discreto para nao poluir o visual claro
- Dark mode: dourado mais vibrante e luminoso

### Detalhes tecnicos

```text
Scrollbar customizada:
  Track: transparente (sem fundo)
  Thumb: gradiente vertical gold-soft -> gold-hot
  Largura: 4px (6px no hover)
  Glow: box-shadow dourado no thumb
  Firefox: scrollbar-width: thin + scrollbar-color
```

Os estilos serao aplicados globalmente via `*` selector para cobrir todas as areas com scroll da aplicacao (paginas, modais, sidebar, etc.), mantendo a estetica consistente em todo o app.

