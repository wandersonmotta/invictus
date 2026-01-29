
## Objetivo (o que você descreveu)
1) O nome no topo deve ser **sempre Nome + Sobrenome** (não pode aparecer “Perfil”).  
2) Isso deve ser **obrigatório**: se a pessoa não preencheu Nome e Sobrenome, ela fica **bloqueada** e é levada para `/perfil`.  
3) O visual do menu do usuário no top bar precisa ficar **clean / luxuoso / sofisticado**:
   - Sem “amarelo chapado”
   - Hover/ativo com **glass sutil**
   - Nome com metálico **seguindo o mouse** (igual o “FRATERNIDADE”), mas **mais legível**
   - Dropdown “Sair” com **glass premium**, porém **sem chanfro** (sem cut-corners)

---

## Diagnóstico rápido do que está acontecendo hoje
- O “Perfil” ainda aparece porque o `UserMenu.tsx` usa fallback: `fullName || display_name || "Perfil"`.
- O chanfro que você não gostou vem do uso de `invictus-modal-glass` no dropdown, que aplica `clip-path` (cut corners).
- O nome metálico hoje está em overlay via `GoldHoverText`, mas:
  - ele está aplicado como “camada por cima” do texto base
  - e o estado “ativo” está mais “ring” do que “metal + borda champagne”
- A obrigatoriedade hoje existe só no formulário (validação), mas não existe um “guard” que bloqueia navegação quando os campos estão vazios.

---

## Mudança 1 — “Obrigatório”: bloquear navegação até completar Nome + Sobrenome
### O que será feito
- Ajustar o guard de rota `RequireAuth.tsx` (que já valida `access_status`) para também validar **completude do perfil**:
  - buscar `first_name` e `last_name` junto com `access_status`
  - se `first_name` ou `last_name` estiver vazio:
    - permitir apenas um conjunto mínimo de rotas (ex.: `/perfil`, `/auth`, `/reset-password`)
    - redirecionar qualquer outra rota automaticamente para `/perfil`
- Benefício: o usuário nunca verá “Perfil” como label no topo porque ele nem consegue navegar sem preencher.

### Arquivos envolvidos
- `src/auth/RequireAuth.tsx` (principal)
- (opcional) `src/pages/Perfil.tsx` para exibir uma mensagem mais “executiva” quando o guard estiver bloqueando: “Complete Nome e Sobrenome para continuar.”

### Critérios de aceite
- Usuário loga, tenta ir para qualquer tela sem nome/sobrenome -> cai em `/perfil`.
- Depois de salvar nome/sobrenome -> navegação libera automaticamente.

---

## Mudança 2 — Top bar: nome “metal follow mouse” (legível) + hover glass sofisticado (sem amarelo)
Você pediu “padrão igual ao FRATERNIDADE”, mas legível. O “FRATERNIDADE” usa `GoldHoverText` com brilho e radial gradient seguindo o mouse. Vamos reutilizar isso com intensidade menor.

### O que será feito no `UserMenu.tsx`
1) **Remover o fallback “Perfil”**
   - Como teremos bloqueio por guard, o fallback fica praticamente desnecessário.
   - Mesmo assim, vamos trocar por algo neutro e premium enquanto carrega (ex.: `""` + skeleton / placeholder “—”), para nunca aparecer “Perfil”.

2) **Nome com efeito “segue o mouse” mais sutil**
   - Trocar a camada overlay atual por:
     - texto base clean (neutro, sempre legível)
     - `GoldHoverText` aplicado ao nome com `intensity` menor (ex.: 0.55–0.7)
   - Ajustar o `GoldHoverText` para ficar “mais acetinado”:
     - reduzir drop-shadow no estado ativo
     - manter opacidade base mais alta (para legibilidade)

3) **Hover do trigger (avatar + nome)**
   - Manter sem amarelo chapado.
   - Refinar o hover para parecer “glass” e “champagne edge”:
     - background bem sutil
     - leve borda interna (inset) dourada com opacidade baixa, em vez de ring chamativo
   - Efeito de desvanecer:
     - avatar e base text levemente mais opacos no hover
     - ao abrir (data-state=open) mantém a sensação “metálico ativo” sem ficar gritando.

### Arquivos envolvidos
- `src/components/UserMenu.tsx`
- `src/components/GoldHoverText.tsx` (ajuste fino de legibilidade, sem quebrar usos existentes)

---

## Mudança 3 — Dropdown “Sair”: glass premium SEM chanfro (sem cut corners)
Você escolheu “Sem chanfro no menu”.

### O que será feito
- Criar um estilo específico para dropdown do top bar, com:
  - glass premium (blur + transparência controlada)
  - moldura champagne sutil (linear gradient no border)
  - **border-radius normal** (sem `clip-path`)
- Aplicar isso apenas no `DropdownMenuContent` do `UserMenu`, para não mudar outros modais do app.

### Arquivos envolvidos
- `src/styles/invictus-topbar.css`:
  - adicionar uma classe nova, por exemplo:
    - `.invictus-topbar-menu-glass` (rounded, sem clip-path)
- `src/components/UserMenu.tsx`:
  - trocar `invictus-modal-glass` por `invictus-topbar-menu-glass` no menu
  - manter z-index alto e background não-transparente

### Critérios de aceite
- Ao abrir o dropdown: sem cantos chanfrados, mas ainda com vidro premium e borda dourada bem discreta.
- Item “Sair”: hover/focus sem amarelo, com glass sutil e texto metálico dourado.

---

## Ajustes finais (acabamento)
- Ajustar transições para ficar “executivo”:
  - tempos (160–200ms)
  - menos glow, mais “polish”
- Garantir contraste:
  - nome legível em repouso
  - efeito metálico aparece no hover sem “sumir” o texto

---

## Sequência de implementação (ordem)
1) `RequireAuth.tsx`: adicionar bloqueio por perfil incompleto (first_name/last_name).
2) `UserMenu.tsx`: remover fallback “Perfil” e ajustar rendering/hover.
3) `invictus-topbar.css`: criar estilo do dropdown sem chanfro (novo glass).
4) `GoldHoverText.tsx`: ajuste fino de legibilidade (intensity + sombra) mantendo compatibilidade.
5) Testes manuais end-to-end:
   - usuário sem perfil -> bloqueado em /perfil
   - salvar -> top bar mostra Nome Sobrenome
   - hover -> metálico “segue o mouse” sutil, sem amarelo chapado
   - click -> dropdown sem chanfro + “Sair” metálico dourado

---

## Observações técnicas importantes
- Vamos manter os estilos do restante do app intactos: o “sem chanfro” será apenas para o dropdown do top bar (não vamos mexer no padrão de modais “Invictus Glass” do resto do sistema).
- A obrigatoriedade será aplicada no guard (front-end). Se você quiser também “blindar” isso no backend (ex.: impedir `approved` sem nome), dá para evoluir depois com validação server-side/triggers, mas não é necessário para entregar a experiência agora.

