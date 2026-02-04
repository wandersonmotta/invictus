
# Plano: Bottom Navigation Bar Mobile (Estilo Invictus)

## Visão Geral

Implementar uma barra de navegação fixa na parte inferior da tela (bottom navigation) visível apenas em dispositivos mobile, seguindo o modelo da imagem de referência. A barra terá 5 itens principais, sendo o último um botão "Menu" que abre um drawer/sheet com todas as opções de navegação.

## Estrutura da Bottom Nav

```text
┌─────────────────────────────────────────────────────────┐
│  🏠       💼        🎁        ❓        ☰              │
│ Início  Carteira  Pontos   Suporte   Menu             │
└─────────────────────────────────────────────────────────┘
```

### Comportamento dos Itens:

| Item | Ícone | Ação |
|------|-------|------|
| **Início** | Home | Navega para `/app` (Home) |
| **Carteira** | Wallet | Placeholder (futuro - mostra toast de "em breve") |
| **Pontos** | Gift/Award | Placeholder (futuro - mostra toast de "em breve") |
| **Suporte** | HelpCircle | Placeholder ou link externo (configurável) |
| **Menu** | Menu (hamburger) | Abre sheet/drawer com todas as rotas |

### Menu Drawer (ao clicar em "Menu"):

O drawer lateral (ou bottom sheet) conterá:
- Feed
- Mapa
- Buscar
- Mensagens
- Comunidade
- Leads
- Perfil
- Class
- Admin (se for admin)

## Arquivos a Criar/Modificar

### 1. Criar: `src/components/mobile/MobileBottomNav.tsx`

Componente principal da bottom navigation:

```tsx
// Estrutura básica
- Container fixo no bottom com backdrop-blur (glassmorphism Invictus)
- 5 botões com ícones e labels
- Estado ativo para "Início" quando em /app
- Click handlers para cada item
- Integração com sheet para o "Menu"
```

### 2. Criar: `src/components/mobile/MobileMenuSheet.tsx`

Drawer/sheet que abre ao clicar em "Menu":

```tsx
// Conteúdo
- Lista de navegação estilizada (mesmo visual da sidebar)
- Agrupa itens por seção (Início, Comunicação, Marketing, Conta)
- Fecha ao selecionar um item
- Animação suave de entrada/saída
```

### 3. Criar: `src/styles/invictus-mobile-nav.css`

Estilos específicos para a bottom nav seguindo o padrão Invictus:

```css
/* Estilo glass premium */
.invictus-mobile-nav {
  background: linear-gradient(180deg, hsl(var(--background) / 0.85), hsl(var(--background) / 0.92));
  backdrop-filter: blur(24px) saturate(170%);
  border-top: 1px solid hsl(var(--gold-hot) / 0.25);
  /* Borda dourada sutil no topo */
}

.invictus-mobile-nav-item {
  /* Estilo do item */
}

.invictus-mobile-nav-item[data-active="true"] {
  /* Item ativo com destaque dourado */
}
```

### 4. Modificar: `src/components/AppLayout.tsx`

Adicionar a bottom nav e ajustar padding do conteúdo:

```tsx
// Mudanças:
- Importar MobileBottomNav
- Renderizar MobileBottomNav apenas em mobile (useIsMobile)
- Adicionar padding-bottom extra no conteúdo principal em mobile
  para não ficar escondido atrás da nav
- Ocultar o SidebarTrigger no header (a sidebar será acessada via Menu)
```

### 5. Modificar: `src/index.css`

Importar o novo arquivo de estilos:

```css
@import "./styles/invictus-mobile-nav.css";
```

## Layout Técnico

### Dimensões:
- Altura da bottom nav: `64px` (h-16)
- Padding inferior do conteúdo: `pb-20` (80px para dar respiro)
- Z-index: `z-50` (acima do conteúdo, abaixo de modais)

### Responsividade:
- Visível apenas em: `md:hidden` (abaixo de 768px)
- Desktop: Mantém sidebar atual inalterada

### Hierarquia Visual:
```text
┌────────────────────────────────┐
│          Top Bar               │ z-20
├────────────────────────────────┤
│                                │
│         Conteúdo               │
│                                │
│                                │
├────────────────────────────────┤
│       Bottom Nav               │ z-50
└────────────────────────────────┘
```

## Detalhes de Implementação

### Ícones (Lucide React):
- Início: `Home`
- Carteira: `Wallet`
- Pontos: `Gift` ou `Award`
- Suporte: `HelpCircle`
- Menu: `Menu`

### Estados Visuais:
- **Default**: Ícone e texto em cor muted
- **Active**: Ícone e texto com gradiente/brilho dourado
- **Pressed**: Leve feedback visual (scale ou opacidade)

### Animações:
- Menu sheet: slide-in da direita ou bottom (usando Sheet do shadcn)
- Itens: transição suave de cor (180ms)

## Segurança e Condições

### Usuários Pendentes (access_status !== "approved"):
- Bottom nav mostra apenas: Início, Carteira, Pontos, Suporte
- Menu mostra apenas: Perfil
- Mesma lógica já aplicada na sidebar atual

### Admins:
- Menu inclui item "Admin" na lista

## Resultado Visual Esperado

A bottom nav terá o estilo premium Invictus:
- Background glass com blur
- Borda dourada sutil no topo (champagne edge)
- Ícones e texto com tratamento metálico
- Item ativo destacado com acento dourado
- Transições suaves e elegantes

## Resumo de Arquivos

| Arquivo | Operação |
|---------|----------|
| `src/components/mobile/MobileBottomNav.tsx` | Criar |
| `src/components/mobile/MobileMenuSheet.tsx` | Criar |
| `src/styles/invictus-mobile-nav.css` | Criar |
| `src/components/AppLayout.tsx` | Modificar |
| `src/index.css` | Modificar |

## Testes a Realizar

1. Verificar visualização em mobile (iPhone, Android)
2. Testar navegação: Início deve ir para /app
3. Testar placeholder: Carteira/Pontos/Suporte mostram toast "Em breve"
4. Testar Menu: abre drawer com todas as opções
5. Testar navegação pelo Menu: fecha drawer e navega corretamente
6. Verificar que a sidebar original continua funcionando em desktop
7. Confirmar que o conteúdo não fica escondido atrás da bottom nav
