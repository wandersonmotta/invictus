
# Plano: Corrigir Escopo de Tema — Landing/Auth Sempre Dark

## Problema Identificado

O hook `useForceDark()` manipula corretamente as classes no DOM (`<html class="dark">`), mas o componente `LandingBackground.tsx` usa `useTheme()` do `next-themes`, que mantém seu próprio estado interno.

Quando o usuário escolhe tema "light" no sistema, o `resolvedTheme` retorna `"light"` mesmo que a classe DOM seja `dark`, causando o rendering incorreto.

## Solução

**Remover completamente a lógica de tema dos componentes de páginas públicas.** Esses componentes devem assumir que sempre estarão em dark mode, sem consultar o `next-themes`.

---

## Arquivos a Modificar

### 1. `src/components/landing/LandingBackground.tsx`

**Mudança:** Remover `useTheme()` e assumir sempre dark.

```tsx
// ANTES
import { useTheme } from "next-themes";
export function LandingBackground() {
  const { resolvedTheme } = useTheme();
  const isDark = !mounted || resolvedTheme === "dark";
  // ...
}

// DEPOIS
export function LandingBackground() {
  // Páginas públicas são sempre dark — não consulta o tema do sistema
  const isDark = true;
  // ...
}
```

**Resultado:** A landing page sempre renderiza com overlay cinematográfico dark, independente da escolha do usuário.

---

### 2. `src/components/auth/AuthBackground.tsx`

Este arquivo já está correto — não usa `useTheme()`. Nenhuma mudança necessária.

---

### 3. `src/hooks/useForceDark.ts`

O hook atual está funcional para garantir que a classe CSS seja aplicada. Pode ser simplificado para não depender de estado anterior:

```tsx
// VERSÃO ROBUSTA
export function useForceDark() {
  React.useEffect(() => {
    // Força dark imediatamente
    document.documentElement.classList.add("dark");
    document.documentElement.classList.remove("light");
    
    return () => {
      // Ao sair, remove dark para que o next-themes reassuma
      // O ThemeProvider vai reaplicar a classe correta automaticamente
      document.documentElement.classList.remove("dark", "light");
    };
  }, []);
}
```

---

### 4. Verificação das Páginas Públicas

Confirmar que as seguintes páginas usam `useForceDark()`:

| Página | Status |
|--------|--------|
| `src/pages/Landing.tsx` | Já usa `useForceDark()` |
| `src/pages/Auth.tsx` | Já usa `useForceDark()` |
| `src/pages/ResetPassword.tsx` | Já usa `useForceDark()` |
| `src/pages/AguardandoAprovacao.tsx` | Já usa `useForceDark()` |

---

## Fluxo Final

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                         Usuário acessa o sistema                        │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
         ┌──────────────────────────┼──────────────────────────┐
         ▼                          ▼                          ▼
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────────┐
│   Landing (/)   │       │   Auth (/auth)  │       │  App Logado (/app)  │
│                 │       │                 │       │                     │
│ useForceDark()  │       │ useForceDark()  │       │ useTheme() funciona │
│ isDark = true   │       │ isDark = true   │       │ Tema do sistema ou  │
│ (hardcoded)     │       │ (hardcoded)     │       │ escolha do usuário  │
│                 │       │                 │       │                     │
│ SEMPRE DARK     │       │ SEMPRE DARK     │       │ LIGHT ou DARK       │
└─────────────────┘       └─────────────────┘       └─────────────────────┘
```

---

## Resumo de Mudanças

| Arquivo | Ação |
|---------|------|
| `src/components/landing/LandingBackground.tsx` | Remover `useTheme()`, hardcode `isDark = true` |
| `src/hooks/useForceDark.ts` | Simplificar cleanup para não restaurar tema anterior |
| `src/pages/Landing.tsx` | Já correto |
| `src/pages/Auth.tsx` | Já correto |
| `src/pages/ResetPassword.tsx` | Já correto |
| `src/pages/AguardandoAprovacao.tsx` | Já correto |

---

## Testes a Realizar

1. Configurar tema do sistema em light
2. Acessar landing page → deve estar dark
3. Acessar /auth → deve estar dark
4. Fazer login → sistema deve seguir tema light (ou a escolha salva)
5. Alternar para dark no menu
6. Fazer logout → landing deve estar dark
7. Fazer login novamente → sistema deve estar dark (escolha persistida)
8. Navegar entre páginas internas → tema persistente
