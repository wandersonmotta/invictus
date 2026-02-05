
## Plano de Correcao: Layout Mobile do Financeiro

### Problemas Identificados

1. **Toggle de tema no header mobile esta quebrando o layout**
   - Os 3 botoes de tema (Sistema/Claro/Escuro) + botao Sair nao cabem no header
   - Resultado: texto "FINANCEIRO" fica cortado (como mostra a screenshot)
   - O toggle foi colocado no lugar errado

2. **Nao usa o padrao de navegacao mobile/tablet do app**
   - O app principal usa: header simples + barra inferior flutuante + menu drawer
   - O financeiro esta usando: header com navegacao inline (sem barra inferior)
   - Precisa seguir o mesmo padrao para consistencia

---

### Solucao Proposta

#### Arquitetura Final (igual ao app principal)

```text
Desktop (>= 1024px):
+----------------+---------------------------+
|    Sidebar     |       Conteudo            |
| - Logo         |                           |
| - Nav items    |                           |
| - Toggle tema  |                           |
| - Sair         |                           |
+----------------+---------------------------+

Mobile/Tablet (< 1024px):
+---------------------------------------+
|  Logo + FINANCEIRO        | UserMenu  |  <- Header simples
+---------------------------------------+
|                                       |
|            Conteudo                   |
|                                       |
+---------------------------------------+
| Auditoria | Historico | Relatorios | Menu |  <- Barra inferior flutuante
+---------------------------------------+
```

---

### Arquivos a Criar

#### 1. `src/components/financeiro/FinanceiroBottomNav.tsx`

Novo componente baseado no `MobileBottomNav`:
- Itens: Fila de Auditoria, Historico, Relatorios, Menu
- Usa o hook `useIsMobileOrTablet` para aparecer apenas em < 1024px
- Abre o sheet do menu ao clicar em "Menu"

#### 2. `src/components/financeiro/FinanceiroMenuSheet.tsx`

Novo componente baseado no `MobileMenuSheet`:
- Cabecalho com avatar do usuario (financeiro nao precisa perfil completo, pode ser simplificado)
- Navegacao: Fila de Auditoria, Historico, Relatorios
- Toggle de tema (igual ao UserMenu do app)
- Botao Sair
- Estilo glass premium com as classes invictus existentes

---

### Arquivos a Modificar

#### 3. `src/components/financeiro/FinanceiroLayout.tsx`

Mudancas:

**Header Mobile (simplificar):**
- Remover o toggle de tema do header
- Remover o botao de logout do header
- Manter apenas: Logo + "FINANCEIRO" + UserMenu simples (avatar + dropdown com tema + sair)

**Sidebar Desktop:**
- Manter como esta (toggle de tema + botao Sair na parte inferior)

**Estrutura:**
- Adicionar o `FinanceiroBottomNav` no final
- Adicionar padding inferior no mobile para nao cobrir conteudo

---

### Detalhes de Implementacao

#### FinanceiroBottomNav.tsx

```text
Items da barra:
1. Auditoria (icone: ListChecks) -> /financeiro/dashboard
2. Historico (icone: FileText) -> /financeiro/historico
3. Relatorios (icone: BarChart3) -> /financeiro/relatorios
4. Menu (icone: Menu) -> abre FinanceiroMenuSheet
```

#### FinanceiroMenuSheet.tsx

```text
Secoes:
- Header com avatar simplificado
- Navegacao (3 itens)
- Separador
- Toggle de tema (Sistema/Claro/Escuro)
- Separador
- Botao Sair
```

#### FinanceiroLayout.tsx - Header Mobile

```text
Antes (problematico):
| Logo FINANCEIRO | [Sistema][Claro][Escuro] [Sair] |

Depois (limpo):
| Logo FINANCEIRO | [Avatar dropdown] |
```

O dropdown do avatar contera:
- Toggle de tema
- Botao Sair

---

### Estilizacao

Reutilizar as classes CSS existentes:
- `invictus-mobile-nav` (barra inferior flutuante)
- `invictus-mobile-nav-item` (itens da barra)
- `invictus-mobile-menu-sheet` (sheet de menu)
- `invictus-mobile-menu-item` (itens do menu)
- `invictus-topbar-menu-glass` (dropdown premium)

---

### Resultado Esperado

1. Header mobile limpo: apenas logo + texto + menu do usuario
2. Barra inferior flutuante com navegacao rapida (Auditoria/Historico/Relatorios/Menu)
3. Menu drawer com todas as opcoes + toggle de tema + logout
4. Consistencia visual com o app principal
5. Layout desktop permanece igual (sidebar com toggle + sair)

---

### Resumo de Arquivos

```text
Criar:
- src/components/financeiro/FinanceiroBottomNav.tsx
- src/components/financeiro/FinanceiroMenuSheet.tsx

Editar:
- src/components/financeiro/FinanceiroLayout.tsx
```
