
# Plano: Refinamento do Tema Light Premium + Escopo de Tema por Área

## Visão Geral

Implementaremos as seguintes melhorias:

1. **Landing page e autenticação: sempre dark** — independente da escolha do usuário
2. **Tema do sistema como padrão** — ao invés de forçar dark, usa a preferência do SO
3. **Correções de legibilidade** — fontes, glass e bordas adaptadas para o tema light
4. **Glass visível no light** — ajustar opacidades e contrastes para que os efeitos glass sejam perceptíveis

---

## Arquitetura da Solução

```text
┌─────────────────────────────────────────────────────────────────┐
│                   ThemeProvider (next-themes)                   │
│          defaultTheme="system" + enableSystem={true}            │
└─────────────────────────────────────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
┌───────────────┐      ┌───────────────┐      ┌───────────────────┐
│ Landing.tsx   │      │  Auth.tsx     │      │  AppLayout.tsx    │
│ (força dark)  │      │ (força dark)  │      │ (tema escolhido)  │
└───────────────┘      └───────────────┘      └───────────────────┘
```

**Estratégia:** As páginas Landing, Auth, ResetPassword e AguardandoAprovacao forçam a classe `dark` no elemento `<html>`, restaurando o tema do usuário ao sair.

---

## Parte 1: Tema do Sistema como Padrão

### Arquivo: `src/App.tsx`

Alterar o `ThemeProvider` para usar o tema do sistema:

```tsx
<ThemeProvider
  attribute="class"
  defaultTheme="system"        // ← muda de "dark" para "system"
  enableSystem={true}          // ← ativa leitura da preferência do SO
  storageKey="invictus-theme"
  disableTransitionOnChange={false}
>
```

**Comportamento:**
- Primeira visita: usa tema do SO (light ou dark)
- Após toggle: persiste a escolha do usuário
- Usuário pode voltar ao "padrão do sistema" se implementarmos opção adicional

---

## Parte 2: Forçar Dark nas Áreas Públicas

### Novo Hook: `src/hooks/useForceDark.ts`

Cria um hook reutilizável que força o tema dark temporariamente:

```tsx
import * as React from "react";
import { useTheme } from "next-themes";

export function useForceDark() {
  const { resolvedTheme, setTheme } = useTheme();
  
  React.useEffect(() => {
    // Guarda o tema atual
    const previousTheme = resolvedTheme;
    
    // Força dark
    document.documentElement.classList.add("dark");
    document.documentElement.classList.remove("light");
    
    return () => {
      // Restaura ao sair da página
      document.documentElement.classList.remove("dark");
      if (previousTheme === "light") {
        document.documentElement.classList.add("light");
      }
    };
  }, []);
}
```

### Arquivos que usarão o hook:
- `src/pages/Landing.tsx` — adicionar `useForceDark()`
- `src/pages/Auth.tsx` — adicionar `useForceDark()`
- `src/pages/ResetPassword.tsx` — adicionar `useForceDark()`
- `src/pages/AguardandoAprovacao.tsx` — adicionar `useForceDark()`

---

## Parte 3: Correções de Legibilidade no Light

### 3.1 Glass Surface (`.invictus-surface`)

**Problema:** O glass no light está muito transparente, quase invisível.

### Arquivo: `src/index.css`

Adicionar regras específicas para light (token `--glass` já ajustado para 0.78):

```css
/* Light mode: glass mais opaco e com mais contraste */
:root .invictus-surface {
  background: linear-gradient(
    180deg,
    hsl(var(--card) / 0.92) 0%,
    hsl(var(--card) / 0.88) 100%
  );
  box-shadow:
    0 0 0 1px hsl(var(--border) / 0.65),
    0 12px 40px -20px hsl(var(--foreground) / 0.12);
}

.dark .invictus-surface {
  /* mantém a versão atual (glass translúcido) */
  background: linear-gradient(
    180deg,
    hsl(var(--card) / var(--glass)) 0%,
    hsl(var(--card) / calc(var(--glass) - 0.08)) 100%
  );
}
```

### 3.2 Frame (`.invictus-frame`)

Ajustar bordas e sombras para serem visíveis no light:

```css
:root .invictus-frame {
  box-shadow:
    0 0 0 1px hsl(var(--border) / 0.70),
    0 12px 40px -20px hsl(var(--foreground) / 0.10),
    0 0 0 1px hsl(var(--primary) / 0.08) inset;
}

.dark .invictus-frame {
  /* mantém versão atual */
}
```

### 3.3 Tokens de Cor (ajustes finos)

Melhorar contraste de texto no light:

```css
:root {
  /* foreground mais escuro para melhor legibilidade */
  --foreground: 30 5% 12%;           /* era 15% → 12% */
  
  /* muted-foreground mais contrastado */
  --muted-foreground: 30 5% 38%;     /* era 42% → 38% */
  
  /* border mais visível */
  --border: 40 8% 78%;               /* era 82% → 78% */
}
```

---

## Parte 4: Ajustes nos Componentes de Mensagens

### Arquivo: `src/components/messages/ThreadList.tsx`

O texto está com baixo contraste no light. Ajustar:

```tsx
// Linha 86: trocar text-muted-foreground para text-foreground
<div className="truncate text-sm font-medium text-foreground">{t.title}</div>
```

### Arquivo: `src/components/messages/ChatView.tsx`

Garantir que headers e textos usem cores adequadas:

```tsx
// Linha 182: adicionar text-foreground explícito
<div className="truncate text-sm font-semibold text-foreground">Conversa</div>
```

---

## Parte 5: Tabs e Inputs Adaptados

### Arquivo: `src/pages/Mensagens.tsx`

A `TabsList` está usando `bg-muted/20` que fica invisível no light:

```tsx
// Linha 56: ajustar para classes que funcionam em ambos os temas
<TabsList className="h-11 w-full bg-muted">
```

### Arquivo: `src/components/ui/tabs.tsx` (opcional)

Verificar que o componente base usa tokens que funcionam em ambos os temas.

---

## Parte 6: Topbar Glass Adaptativo

### Arquivo: `src/styles/invictus-topbar.css`

O dropdown do menu já tem regras light/dark. Verificar e reforçar:

```css
/* Light mode: dropdown mais sólido */
.invictus-topbar-menu-glass {
  background:
    linear-gradient(180deg, hsl(var(--background) / 0.96), hsl(var(--background) / 0.94));
  border: 1px solid hsl(var(--border) / 0.50);
  box-shadow:
    0 12px 40px -20px hsl(var(--foreground) / 0.15);
}

.dark .invictus-topbar-menu-glass {
  /* mantém versão atual (glass translúcido) */
}
```

---

## Parte 7: Modal Glass Adaptativo

### Arquivo: `src/index.css`

O `.invictus-modal-glass` precisa de ajustes para light:

```css
/* Light mode: modal mais sólido */
:root .invictus-modal-glass {
  background: linear-gradient(
    180deg,
    hsl(var(--background) / 0.95) 0%,
    hsl(var(--card) / 0.92) 55%,
    hsl(var(--background) / 0.90) 100%
  );
  backdrop-filter: blur(16px);
}

.dark .invictus-modal-glass {
  /* mantém versão atual */
}
```

---

## Resumo de Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/App.tsx` | `defaultTheme="system"`, `enableSystem={true}` |
| `src/hooks/useForceDark.ts` | **NOVO** — hook para forçar dark |
| `src/pages/Landing.tsx` | Usar `useForceDark()` |
| `src/pages/Auth.tsx` | Usar `useForceDark()` |
| `src/pages/ResetPassword.tsx` | Usar `useForceDark()` |
| `src/pages/AguardandoAprovacao.tsx` | Usar `useForceDark()` |
| `src/index.css` | Ajustes de tokens light + glass adaptativo |
| `src/styles/invictus-topbar.css` | Glass mais sólido no light |
| `src/styles/invictus-sidebar.css` | Já tem regras light (verificar) |
| `src/pages/Mensagens.tsx` | Ajustar TabsList |
| `src/components/messages/ThreadList.tsx` | Ajustar contraste de texto |
| `src/components/messages/ChatView.tsx` | Ajustar contraste de headers |

---

## Resultado Esperado

1. **Primeira visita** → Tema do sistema (light ou dark)
2. **Landing/Auth** → Sempre dark, independente da escolha
3. **App interno** → Respeita escolha do usuário
4. **Toggle** → Usuário alterna entre light/dark no menu
5. **Glass no light** → Visível e sofisticado (não invisível)
6. **Fontes legíveis** → Contraste adequado em ambos os temas

---

## Testes a Realizar

1. Configurar SO em modo light → abrir app → verificar que está light
2. Acessar landing → deve estar dark
3. Acessar /auth → deve estar dark
4. Fazer login → verificar que voltou ao tema do usuário
5. Alternar tema no menu → verificar transição
6. Verificar Mensagens, Perfil, Home no tema light
7. Verificar dropdowns e modais no tema light
8. Recarregar página e confirmar persistência

