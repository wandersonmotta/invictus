
## Objetivo
Deixar o app realmente usável no celular (responsivo de verdade), sem “apertar” conteúdo e sem categorias gigantes, preservando o visual/identidade Invictus e sem mudar funcionalidades.

Você escolheu: **Menu em gaveta (sheet)** no celular.

---

## Diagnóstico (o que está causando o “não responsivo”)
1. **Sidebar fixa no mobile**
   - Hoje o `AppLayout` usa:
     - `SidebarProvider toggleable={false} mobileMode="fixed"`
     - E a `AppSidebar` está `collapsible="none"`
   - Resultado: no celular a sidebar fica **sempre ocupando largura** (até 14rem), “espremendo” as telas (Class/Feed/etc.). Isso é o principal motivo de “não dá pra ver os conteúdos”.

2. **Class (/class) com cards de largura fixa**
   - Cada item do carrossel está com `w-[168px] sm:w-[188px]`.
   - Em telas pequenas, isso vira sensação de “categoria grande” + menos itens visíveis.
   - Somado ao conteúdo espremido pela sidebar fixa, piora muito.

---

## Mudança mínima e segura (sem mexer em UX além do necessário)
### 1) Transformar a navegação mobile em “gaveta” (Sheet) e liberar a largura do conteúdo
**Arquivos envolvidos**
- `src/components/AppLayout.tsx`
- `src/components/AppSidebar.tsx`

**O que será feito**
- Em `AppLayout.tsx`:
  - Trocar `mobileMode="fixed"` para `mobileMode="sheet"` (ou simplesmente remover e deixar o default “sheet”).
  - Trocar `toggleable={false}` para `toggleable={true}`.
  - Adicionar **um único** botão de abrir menu (um `SidebarTrigger`) no header **apenas no mobile** (`md:hidden`).
  - Manter o header visualmente igual (logo + Fraternidade + sino + user menu). O trigger entra só como ícone no começo.

- Em `AppSidebar.tsx`:
  - Ajustar o `Sidebar` para permitir comportamento mobile corretamente (em vez de `collapsible="none"`, usar o padrão do componente para “sheet/offcanvas”).
  - Garantir que ao clicar em qualquer item no mobile, o menu **feche** (para a navegação ficar natural). Isso é importante para UX.

**Impacto esperado**
- No celular, o conteúdo passa a ocupar **100% da largura**.
- O menu fica acessível via botão (gaveta).
- No desktop, o comportamento atual permanece (sidebar normal).

---

### 2) Ajustar a página Class para carrosséis mais “mobile friendly”
**Arquivo envolvido**
- `src/pages/Class.tsx`

**O que será feito**
- Trocar a largura fixa `w-[168px]` por uma largura responsiva com `clamp(...)` (ex.: algo como `w-[clamp(140px,42vw,188px)]`), mantendo o visual Netflix-like, só adaptando o tamanho.
- Melhorar a rolagem horizontal no mobile:
  - Adicionar `snap-x snap-mandatory` no container do carrossel
  - Adicionar `snap-start` em cada card
  - Isso não muda a UI, só melhora a usabilidade.
- Garantir que os paddings negativos (`-mx-4 px-4`) não cortem conteúdo em telas pequenas (ajuste fino se necessário).

**Impacto esperado**
- Você consegue ver mais itens por vez no celular.
- Rolagem horizontal fica “certinha” (encaixa card por card).
- Conteúdo não fica “grande demais” e nem escondido.

---

### 3) Verificação global de “telas espremidas” e correções pontuais (sem redesign)
**Alvos**
- `/feed` (já está max-w 480px, mas pode ficar apertado se a largura estiver ruim — deve melhorar só com a sidebar em sheet)
- `/mapa` (grid já é responsivo; o problema maior costuma ser sidebar)
- `/mensagens` e `/comunidade` (já têm lógica mobile; devem melhorar automaticamente com largura livre)

**O que será feito**
- Conferir cada página em viewport mobile (390x844):
  - Sem overflow horizontal
  - Sem textos cortados
  - Sem colunas “apertadas”
- Se aparecer algum overflow específico:
  - Ajuste mínimo em container (ex.: trocar `grid` por `flex-col` apenas no mobile, ou rever `max-w`/padding)
  - Sempre sem mexer em comportamento.

---

## Como vamos testar (checklist objetivo)
1. No preview, alternar para **mobile** (ícone do telefone).
2. Validar:
   - O conteúdo ocupa a largura inteira (sem sidebar fixa).
   - O botão de menu abre a gaveta.
   - Clicar num item do menu navega e **fecha a gaveta**.
3. Entrar em:
   - `/class`: rolar categorias e carrosséis, confirmar que vê o conteúdo sem ficar “grande demais”.
   - `/feed`: abrir post, rolar, abrir modal de post e fechar.
   - `/mensagens`: abrir conversa e voltar.
   - `/mapa`: conferir cards laterais e mapa.
4. Rodar uma passada rápida em desktop para garantir que nada mudou no layout desktop.

---

## Entregáveis (o que você vai ver no final)
- Menu mobile em gaveta (sheet) com botão no topo.
- Conteúdo com largura total no celular.
- Class com carrosséis adaptados ao mobile (cards menores e rolagem mais suave).
- Sem mudanças de design “radicais” e sem perda de funcionalidades.

---

## Riscos e como vamos evitar
- **Risco:** quebrar o padrão de sidebar no desktop.  
  **Mitigação:** mudanças condicionadas ao comportamento já previsto no `ui/sidebar.tsx` (ele já suporta `mobileMode="sheet"`).
- **Risco:** menu não fechar ao navegar no mobile.  
  **Mitigação:** fechar explicitamente ao clicar nos links quando estiver em modo mobile.

---

## Próximo passo
Assim que você aprovar, eu implemento:
1) Gaveta no mobile + trigger no topo  
2) Ajustes do `/class` para mobile  
3) Rodada de validação em todas as páginas
