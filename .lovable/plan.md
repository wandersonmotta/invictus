

# Plano: Toggle Dark/Light Premium + Melhorias de Respiro Visual

## Visão Geral

Implementaremos duas mudanças principais:
1. **Melhorias no tema Dark atual** — mais respiro entre seções, contraste suavizado
2. **Toggle Dark/Light Premium** — similar ao Twitter/X, permitindo alternar entre temas

O tema Light será um **cinza perolado/champagne sofisticado** com os mesmos acentos dourados, mantendo a identidade Invictus.

---

## Arquitetura Técnica

O projeto já possui `next-themes` instalado (usado em `sonner.tsx`), facilitando a implementação.

```text
┌──────────────────────────────────────────────────────────────┐
│                      ThemeProvider                           │
│  (next-themes - gerencia classe dark/light no <html>)        │
└──────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
    ┌──────────┐        ┌──────────┐        ┌──────────┐
    │ App.tsx  │        │ index.css│        │ UserMenu │
    │ (wrap)   │        │ (tokens) │        │ (toggle) │
    └──────────┘        └──────────┘        └──────────┘
```

---

## Parte 1: Melhorias de Respiro Visual (Tema Dark)

### Arquivo: `src/index.css`

**Ajustes nas variáveis do tema `.dark`:**

| Token Atual | Novo Valor | Motivo |
|-------------|------------|--------|
| `--background: 0 0% 7%` | `0 0% 8%` | Fundo levemente mais claro para reduzir peso |
| `--muted-foreground: 0 0% 72%` | `0 0% 68%` | Texto secundário um pouco mais suave |

**Novas classes utilitárias de espaçamento:**

```css
.invictus-page {
  @apply space-y-6 sm:space-y-8 lg:space-y-10; /* Antes: 4, 6, 8 */
}
```

---

## Parte 2: Tema Light Premium (Novo)

### Arquivo: `src/index.css`

Criar variantes `.light` (será o `:root` refinado) com paleta perolada/champagne:

```css
:root {
  /* Light Premium: Cinza perolado + Champagne + Gold */
  --background: 40 10% 96%;        /* Off-white quente (não branco puro) */
  --foreground: 30 5% 12%;         /* Grafite quente (não preto puro) */

  --card: 40 8% 98%;               /* Cards levemente mais claros */
  --card-foreground: 30 5% 12%;

  --popover: 40 8% 98%;
  --popover-foreground: 30 5% 12%;

  /* Gold mantido (mesma identidade) */
  --primary: 42 85% 50%;
  --primary-foreground: 40 10% 96%;

  --secondary: 40 6% 92%;
  --secondary-foreground: 30 5% 12%;

  --muted: 40 6% 90%;
  --muted-foreground: 30 5% 45%;

  --accent: 42 85% 50%;
  --accent-foreground: 40 10% 96%;

  --border: 40 8% 85%;
  --input: 40 8% 85%;
  --ring: 42 85% 50%;

  /* Sidebar Light */
  --sidebar-background: 40 8% 97%;
  --sidebar-foreground: 30 5% 18%;
  --sidebar-primary: 42 85% 50%;
  --sidebar-primary-foreground: 40 10% 96%;
  --sidebar-accent: 40 6% 92%;
  --sidebar-accent-foreground: 30 5% 12%;
  --sidebar-border: 40 8% 88%;
  --sidebar-ring: 42 85% 50%;

  /* Glass mais opaco no light */
  --glass: 0.72;
  --gold-soft: 42 75% 52%;
  --gold-hot: 44 80% 48%;
  --gold-badge-foreground: var(--foreground);
}
```

---

## Parte 3: ThemeProvider no App

### Arquivo: `src/App.tsx`

Envolver a aplicação com o `ThemeProvider` do `next-themes`:

```tsx
import { ThemeProvider } from "next-themes";

function App() {
  return (
    <ThemeProvider 
      attribute="class" 
      defaultTheme="dark"
      enableSystem={false}
      storageKey="invictus-theme"
    >
      <QueryClientProvider client={queryClient}>
        {/* ... resto do app */}
      </QueryClientProvider>
    </ThemeProvider>
  );
}
```

### Arquivo: `src/main.tsx`

Remover a linha que força o tema dark:

```diff
- document.documentElement.classList.add("dark");
```

---

## Parte 4: Toggle no Menu do Usuário

### Arquivo: `src/components/UserMenu.tsx`

Adicionar opção de alternar tema no dropdown:

```tsx
import { Moon, Sun, LogOut } from "lucide-react";
import { useTheme } from "next-themes";

export function UserMenu() {
  const { theme, setTheme } = useTheme();
  
  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <DropdownMenu>
      {/* ... trigger existente */}
      <DropdownMenuContent>
        {/* Toggle de tema */}
        <DropdownMenuItem onClick={toggleTheme}>
          {theme === "dark" ? (
            <>
              <Sun className="text-[hsl(var(--gold-hot))]" />
              <GoldHoverText>Modo Claro</GoldHoverText>
            </>
          ) : (
            <>
              <Moon className="text-[hsl(var(--gold-hot))]" />
              <GoldHoverText>Modo Escuro</GoldHoverText>
            </>
          )}
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {/* Sair (existente) */}
        <DropdownMenuItem onClick={signOut}>
          <LogOut className="text-[hsl(var(--gold-hot))]" />
          <GoldHoverText>Sair</GoldHoverText>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

---

## Parte 5: Ajustes na Landing Page

### Arquivo: `src/components/landing/LandingBackground.tsx`

A landing page precisa de backgrounds diferentes por tema:

```tsx
import { useTheme } from "next-themes";

export function LandingBackground() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <div className="...">
      <picture>
        {isDark ? (
          // Background dark (existente - preto e branco cinematográfico)
          <>
            <source media="(min-width: 768px)" srcSet="/images/invictus-landing-bg-1920x1080-v2.jpg" />
            <img src="/images/invictus-landing-bg-1536x1920-v2.jpg" ... />
          </>
        ) : (
          // Background light (novo - versão clara/suave)
          // Usará overlay mais forte para clarear a imagem existente
          <>
            <source media="(min-width: 768px)" srcSet="/images/invictus-landing-bg-1920x1080-v2.jpg" />
            <img 
              src="/images/invictus-landing-bg-1536x1920-v2.jpg" 
              className="h-full w-full object-cover opacity-40"
              ...
            />
          </>
        )}
      </picture>
      
      {/* Overlay adaptativo */}
      <div
        style={{
          backgroundImage: isDark 
            ? "..." // overlay dark existente
            : [
                // overlay light: clareia e adiciona tom perolado
                "linear-gradient(180deg, hsl(40 10% 96% / 0.85), hsl(40 10% 96% / 0.75))",
                "radial-gradient(800px 500px at 25% 5%, hsl(42 85% 50% / 0.06), transparent 50%)",
              ].join(", ")
        }}
      />
    </div>
  );
}
```

---

## Parte 6: Ajustes em Componentes Glass (Opcional)

### Arquivo: `src/styles/invictus-sidebar.css`

Adicionar regras para o tema light (sem classe `.dark`):

```css
/* Light mode: sidebar mais sólida, menos glass */
.invictus-sidebar [data-sidebar="sidebar"] {
  --sidebar-frame-opacity: 0.75;
  --sidebar-frame-soft: 0.12;
  --sidebar-frame-hot: 0.45;
  background: linear-gradient(
    180deg,
    hsl(var(--background) / 0.88) 0%,
    hsl(var(--background) / 0.80) 100%
  );
}

/* Dark mode (existente) */
.dark .invictus-sidebar [data-sidebar="sidebar"] {
  /* ... configurações atuais ... */
}
```

---

## Resumo de Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/index.css` | Refinar `:root` (light premium), ajustar `.dark`, adicionar respiro |
| `src/main.tsx` | Remover `classList.add("dark")` |
| `src/App.tsx` | Adicionar `ThemeProvider` do next-themes |
| `src/components/UserMenu.tsx` | Adicionar toggle de tema no dropdown |
| `src/components/landing/LandingBackground.tsx` | Background adaptativo por tema |
| `src/styles/invictus-sidebar.css` | Regras light/dark para sidebar |
| `src/styles/invictus-topbar.css` | Regras light/dark para topbar |
| `src/styles/invictus-auth.css` | Ajustes de overlay para landing em light |

---

## Resultado Esperado

1. **Usuário abre o app** → Tema dark por padrão (preservado)
2. **Toggle no menu** → Usuário pode alternar para light premium
3. **Persistência** → Preferência salva em localStorage (`invictus-theme`)
4. **Visual Light** → Cinza perolado sofisticado, mesmos acentos dourados
5. **Respiro melhorado** → Mais espaçamento vertical entre seções

---

## Testes a Realizar

1. Alternar tema no menu e verificar transição suave
2. Recarregar página e confirmar que preferência persiste
3. Verificar landing page em ambos os temas
4. Testar sidebar, cards, formulários em light
5. Verificar contraste e legibilidade em ambos os modos

