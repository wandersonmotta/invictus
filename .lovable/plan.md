
# Plano: Bottom Nav Flutuante + Menu Full-Page + Responsividade Mobile

## Resumo das Mudanças

1. **Bottom Nav Flutuante** - Transformar a barra inferior em estilo "ilha flutuante" com bordas arredondadas e margem
2. **Menu Mobile Full-Page** - Redesenhar o Menu para ser uma página completa com foto + nome do usuário no topo
3. **Responsividade da Página Leads** - Ocultar sidebar em mobile e ajustar grids/cards
4. **Renomear "Home" para "Início"** - Em toda a plataforma (sidebar desktop + menu mobile)

---

## 1. Bottom Nav Flutuante (Estilo Ilha)

### Arquivo: `src/styles/invictus-mobile-nav.css`

Transformar a barra de `fixed bottom-0 left-0 right-0` para uma "ilha" centralizada:

```text
ANTES (grudada nas bordas):
┌──────────────────────────────────┐
│   Início  Carteira  Pontos  ...  │
└──────────────────────────────────┘

DEPOIS (flutuante com bordas arredondadas):
      ╭────────────────────────────╮
      │  Início  Carteira  Pontos  │
      ╰────────────────────────────╯
```

Mudanças CSS:
- Adicionar `margin: 0 16px 16px` (ou safe-area)
- Adicionar `border-radius: 20px` (rounded-2xl)
- Manter `backdrop-blur` e borda dourada sutil
- Adicionar sombra mais pronunciada para efeito de elevação

### Arquivo: `src/components/mobile/MobileBottomNav.tsx`

Ajustar classes do container:
- De: `fixed bottom-0 left-0 right-0`
- Para: `fixed bottom-4 left-4 right-4 rounded-2xl`

---

## 2. Menu Mobile Full-Page (Nova Página com Perfil)

### Arquivo: `src/components/mobile/MobileMenuSheet.tsx`

Redesenhar completamente para ser uma **página completa** (side="bottom" com altura total ou navegação real):

```text
┌────────────────────────────────────┐
│  ←                                 │
├────────────────────────────────────┤
│                                    │
│          ┌──────────┐              │
│          │  AVATAR  │              │
│          └──────────┘              │
│        Nome do Usuário             │
│         @username                  │
│                                    │
├────────────────────────────────────┤
│                                    │
│  ● Início          →               │
│  ● Feed            →               │
│  ● Mapa            →               │
│  ● Buscar          →               │
│  ● Mensagens       →               │
│  ● Comunidade      →               │
│  ● Leads           →               │
│  ● Perfil          →               │
│  ● Class           →               │
│  ● Admin           →  (se admin)   │
│                                    │
└────────────────────────────────────┘
```

### Mudanças:
- Usar `SheetContent side="bottom"` com `h-[85vh]` ou `h-full`
- Buscar dados do usuário via `useMyProfile` hook
- Exibir avatar + nome no topo centralizado
- Lista de navegação limpa, sem agrupamentos pesados
- Cada item ocupa linha completa com seta à direita
- Fechar sheet ao navegar

---

## 3. Responsividade da Página Leads

### Arquivo: `src/pages/Leads.tsx`

Ocultar `LeadsSidebar` em mobile e usar navegação por tabs/dropdown:

```tsx
// Antes
<LeadsSidebar activeView={activeView} onViewChange={setActiveView} />

// Depois - ocultar em mobile
<LeadsSidebar 
  activeView={activeView} 
  onViewChange={setActiveView} 
  className="hidden md:flex" // Ocultar em telas < 768px
/>

// Adicionar seletor de view em mobile (dropdown ou tabs)
{isMobile && (
  <LeadsMobileViewSelector 
    activeView={activeView} 
    onViewChange={setActiveView} 
  />
)}
```

### Arquivo: `src/components/leads/LeadsMobileViewSelector.tsx` (NOVO)

Criar um seletor horizontal (tabs ou dropdown) para mobile:

```text
┌────────────────────────────────────┐
│ [Overview] [Meta] [Google] [GA4]  │
└────────────────────────────────────┘
```

Ou um Select/Dropdown:
```text
┌─────────────────────────┐
│  Visão Geral         ▼  │
└─────────────────────────┘
```

### Arquivo: `src/components/leads/views/LeadsOverviewView.tsx`

Ajustar grids para mobile:
```tsx
// KPIs: de 5 colunas para 2 em mobile
<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">

// Platform cards: de 3 para 1 coluna em mobile
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
```

### Arquivo: `src/components/leads/views/LeadsMetaView.tsx`

Ajustar para mobile:
```tsx
// Main grid: de 3 para 1 coluna
<div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

// Cards de funil, revenue e donut empilham verticalmente
```

---

## 4. Renomear "Home" para "Início"

### Arquivos a modificar:

| Arquivo | Mudança |
|---------|---------|
| `src/components/AppSidebar.tsx` | `title: "Home"` → `title: "Início"` |
| `src/components/mobile/MobileMenuSheet.tsx` | `title: "Home"` → `title: "Início"` |

---

## Resumo de Arquivos

| Arquivo | Operação |
|---------|----------|
| `src/styles/invictus-mobile-nav.css` | Modificar (estilo flutuante) |
| `src/components/mobile/MobileBottomNav.tsx` | Modificar (classes floating) |
| `src/components/mobile/MobileMenuSheet.tsx` | Modificar completamente (full-page com avatar) |
| `src/pages/Leads.tsx` | Modificar (responsividade mobile) |
| `src/components/leads/LeadsMobileViewSelector.tsx` | Criar (seletor de views mobile) |
| `src/components/leads/LeadsSidebar.tsx` | Modificar (ocultar em mobile) |
| `src/components/leads/views/LeadsOverviewView.tsx` | Modificar (grids responsivos) |
| `src/components/leads/views/LeadsMetaView.tsx` | Modificar (grids responsivos) |
| `src/components/AppSidebar.tsx` | Modificar ("Home" → "Início") |

---

## Detalhes Técnicos

### Bottom Nav Flutuante - CSS:

```css
.invictus-mobile-nav {
  /* Novo: floating island style */
  margin: 0 1rem;
  margin-bottom: calc(1rem + env(safe-area-inset-bottom, 0px));
  border-radius: 1.25rem; /* rounded-2xl */
  border: 1px solid hsl(var(--gold-hot) / 0.25);
  box-shadow: 
    0 8px 32px -4px hsl(var(--background) / 0.6),
    0 0 0 1px hsl(var(--gold-hot) / 0.1);
  /* Manter backdrop-blur existente */
}
```

### Menu Full-Page - Estrutura:

```tsx
<SheetContent side="bottom" className="h-[90vh] rounded-t-3xl">
  {/* Close button */}
  <button onClick={() => onOpenChange(false)} className="absolute top-4 left-4">
    <X className="h-5 w-5" />
  </button>

  {/* User Profile Header */}
  <div className="flex flex-col items-center pt-12 pb-6">
    <Avatar className="h-20 w-20 border-2 border-primary/30">
      <AvatarImage src={profile?.avatar_url} />
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
    <h2 className="mt-3 text-lg font-semibold">{displayName}</h2>
    <p className="text-sm text-muted-foreground">@{username}</p>
  </div>

  {/* Navigation Items */}
  <nav className="flex flex-col px-4">
    {menuItems.map(item => (
      <button 
        key={item.url}
        onClick={() => handleNavigate(item.url)}
        className="flex items-center justify-between py-4 border-b border-border/20"
      >
        <div className="flex items-center gap-3">
          <item.icon className="h-5 w-5" />
          <span>{item.title}</span>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </button>
    ))}
  </nav>
</SheetContent>
```

### Leads Mobile View Selector:

```tsx
// Usando Select do shadcn/ui
<Select value={activeView} onValueChange={onViewChange}>
  <SelectTrigger className="w-full">
    <SelectValue placeholder="Selecionar visualização" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="overview">Visão Geral</SelectItem>
    <SelectItem value="meta">Meta Ads</SelectItem>
    <SelectItem value="google_ads">Google Ads</SelectItem>
    <SelectItem value="analytics">Analytics</SelectItem>
  </SelectContent>
</Select>
```

---

## Preservação da Identidade Visual

Todas as mudanças mantêm:
- Tema dark premium (grafite + dourado)
- Glassmorphism com backdrop-blur
- Bordas douradas sutis
- Tipografia e espaçamentos existentes
- Animações e transições

---

## Testes a Realizar

1. Verificar bottom nav flutuante em diferentes tamanhos de tela mobile
2. Testar abertura do Menu full-page e navegação
3. Confirmar que a foto + nome do usuário aparecem corretamente
4. Testar página de Leads em mobile com o seletor de views
5. Verificar que "Início" aparece em vez de "Home" em toda a plataforma
6. Confirmar que desktop continua funcionando normalmente
