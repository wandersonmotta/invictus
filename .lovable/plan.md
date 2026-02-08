
# Protecao Anti-Copia do Site

## O que e possivel fazer

E importante ser transparente: **nenhuma protecao no front-end e 100% inviolavel** -- um desenvolvedor experiente sempre consegue contornar. Porem, podemos criar **barreiras significativas** que impedem a copia casual (usuarios comuns, concorrentes sem conhecimento tecnico). Isso cobre 95% dos casos.

## Camadas de protecao que vamos implementar

### 1. Bloquear clique direito (context menu)
Impedir o menu "Inspecionar Elemento" / "Salvar imagem como" / "Ver codigo fonte" pelo clique direito.

### 2. Bloquear selecao de texto
Impedir que o usuario selecione e copie textos da landing page com CSS `user-select: none`.

### 3. Bloquear atalhos de teclado
Interceptar `Ctrl+U` (ver fonte), `Ctrl+S` (salvar pagina), `Ctrl+Shift+I` (DevTools), `Ctrl+Shift+J` (console), `F12`, `Ctrl+C` (copiar), `Ctrl+A` (selecionar tudo).

### 4. Bloquear arrastar imagens
CSS `pointer-events` e atributo `draggable=false` nas imagens para impedir download por drag-and-drop.

### 5. Aviso de propriedade intelectual
Exibir um aviso discreto no console do navegador (como o Facebook faz) alertando que o conteudo e protegido.

### 6. Ofuscacao de imagens via CSS
Servir imagens de fundo via `background-image` ao inves de `<img>` onde possivel, dificultando o "Salvar imagem como".

## Detalhes tecnicos

### Arquivos que serao CRIADOS
- `src/hooks/useCopyProtection.ts` -- Hook que aplica todas as protecoes JS (bloquear context menu, atalhos, arrastar, aviso no console). Sera chamado apenas na landing page.

### Arquivos que serao MODIFICADOS
- `src/pages/Landing.tsx` -- Importar e ativar o hook `useCopyProtection`
- `src/index.css` -- Adicionar regra `.invictus-landing-body` com `user-select: none` e `-webkit-user-drag: none` para bloquear selecao e arraste na landing

### Escopo limitado a landing page
As protecoes serao aplicadas **apenas na landing page publica**, sem afetar o app autenticado (onde o usuario precisa selecionar texto, copiar dados, etc).

### Nenhuma dependencia externa
Tudo com CSS nativo + event listeners em um unico hook React.
