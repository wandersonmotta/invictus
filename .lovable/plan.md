
# Plano: Restrição de Navegação para Onboarding + Redirect Imediato + "Fraternidade"

## Problema Identificado (baseado nas imagens)

1. **Navegação completa visível durante onboarding**: O usuário pendente vê todas as seções (Início, Comunicação, Conta completa com Class) ao invés de apenas "Perfil"
2. **Redirect não é imediato**: Após salvar o perfil, o usuário fica na página `/perfil` vendo "Perfil enviado para análise" ao invés de ir direto para `/aguardando-aprovacao`
3. **Falta "Fraternidade"**: A tela de aguardando aprovação não tem o texto "FRATERNIDADE" abaixo do logo (padrão da identidade visual)

---

## Alterações Necessárias

### 1. Restringir Sidebar para Onboarding
**Arquivo:** `src/components/AppSidebar.tsx`

**Solução:**
- Criar query para buscar `access_status` e `profileComplete` do perfil atual
- Se `access_status !== "approved"` (pendente/onboarding):
  - Exibir SOMENTE a seção "Conta" com apenas o item "Perfil"
  - Esconder: "Início", "Comunicação", "Class", "Administração"
- Se `access_status === "approved"`:
  - Exibir navegação completa normalmente

```text
Lógica:
- Buscar: supabase.from("profiles").select("access_status, first_name, ...")
- isOnboarding = access_status !== "approved"
- if (isOnboarding):
    navSections = [{ label: "Conta", items: [{ title: "Perfil", url: "/perfil", icon: User }] }]
- else:
    navSections = completo
```

### 2. Redirect Imediato Após Salvar Perfil
**Arquivo:** `src/components/profile/ProfileForm.tsx`

**Problema:** Atualmente, quando o perfil é salvo e está "ready for review", o componente mostra um card estático. O usuário precisa ser redirecionado imediatamente para `/aguardando-aprovacao`.

**Solução:**
- Após salvar com sucesso (`onSaved?.()`), se todos os campos obrigatórios estiverem preenchidos e `access_status !== "approved"`:
  - Chamar `window.location.href = "/aguardando-aprovacao"` ou usar `useNavigate()` do React Router
- Remover o bloco que mostra "Perfil enviado para análise" (já que o usuário será redirecionado)

**Arquivo:** `src/auth/RequireAuth.tsx`

**Ajuste:**
- Garantir que quando o usuário está em `/perfil` com perfil completo e `pending`, ele seja redirecionado para `/aguardando-aprovacao` imediatamente
- A lógica já existe na linha 130-131, mas pode não estar funcionando se o perfil query não for invalidado após o save

### 3. Adicionar "FRATERNIDADE" na Tela de Aguardando
**Arquivo:** `src/pages/AguardandoAprovacao.tsx`

**Adição:**
```tsx
<img src={invictusLogo} ... />

{/* NOVO: Adicionar abaixo do logo */}
<p className="invictus-auth-fratname ...">
  FRATERNIDADE
</p>

<h1>Olá, futuro membro Invictus!</h1>
```

Usar o mesmo estilo metálico/dourado aplicado na tela de login.

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/components/AppSidebar.tsx` | Filtrar navegação para mostrar só "Perfil" quando pendente |
| `src/components/profile/ProfileForm.tsx` | Adicionar redirect imediato após salvar perfil completo |
| `src/pages/AguardandoAprovacao.tsx` | Adicionar "FRATERNIDADE" abaixo do logo |

---

## Detalhes Técnicos

### AppSidebar - Navegação Restrita

```typescript
// Buscar status do perfil
const profileQuery = useQuery({
  queryKey: ["sidebar-access", user?.id],
  enabled: !!user?.id,
  queryFn: async () => {
    const { data } = await supabase
      .from("profiles")
      .select("access_status")
      .eq("user_id", user!.id)
      .maybeSingle();
    return data?.access_status ?? "pending";
  },
  staleTime: 10_000,
});

const accessStatus = profileQuery.data ?? "pending";
const isOnboarding = accessStatus !== "approved";

// Navegação condicional
const visibleSections = isOnboarding
  ? [{ label: "Conta", items: [{ title: "Perfil", url: "/perfil", icon: User }] }]
  : [...navSections, ...(isAdmin ? adminSection : [])];
```

### ProfileForm - Redirect Imediato

```typescript
// Após salvar com sucesso
setProfile((data ?? null) as LoadedProfile | null);
toast({ title: "Perfil salvo" });
onSaved?.();

// NOVO: Verificar se perfil completo + pendente = redirect
const savedProfile = data as LoadedProfile | null;
if (
  savedProfile?.access_status !== "approved" &&
  savedProfile?.avatar_url &&
  savedProfile?.first_name?.trim() &&
  savedProfile?.last_name?.trim() &&
  (savedProfile?.postal_code ?? "").replace(/\D/g, "").length === 8 &&
  savedProfile?.bio?.trim() &&
  (savedProfile?.expertises ?? []).length > 0
) {
  // Redirect imediato
  window.location.href = "/aguardando-aprovacao";
  return;
}
```

### AguardandoAprovacao - Adicionar "FRATERNIDADE"

```tsx
<img
  src={invictusLogo}
  alt="Invictus"
  className="mx-auto h-16 w-auto mb-2 drop-shadow-lg"
/>

<p
  className="text-[10px] sm:text-xs font-semibold tracking-[0.35em] text-transparent bg-clip-text mb-6"
  style={{
    backgroundImage: "linear-gradient(135deg, hsl(var(--gold-soft)), hsl(var(--gold-hot)), hsl(var(--gold-soft)))",
  }}
>
  FRATERNIDADE
</p>

<h1 className="text-2xl font-bold text-foreground mb-4">
  Olá, futuro membro Invictus!
</h1>
```

---

## Fluxo Esperado Após Correção

```text
1. Usuário cria conta com convite → status = "pending"
2. Sistema redireciona para /perfil
3. Sidebar mostra APENAS "Perfil" (sem Home, Feed, Mapa, etc.)
4. Usuário preenche foto, nome, bio, CEP, expertise
5. Clica em "Salvar perfil"
6. Sistema valida → sucesso → REDIRECT IMEDIATO para /aguardando-aprovacao
7. Tela exibe logo + "FRATERNIDADE" + mensagem premium + botão "Sair"
8. Administrador aprova → polling detecta → redirect automático para /app
9. Sidebar agora mostra navegação completa
```

---

## Critérios de Aceite

1. Usuário pendente vê APENAS "Perfil" no menu lateral
2. Após salvar perfil completo, redirect IMEDIATO para `/aguardando-aprovacao`
3. Tela `/aguardando-aprovacao` exibe "FRATERNIDADE" abaixo do logo
4. Após aprovação, navegação completa volta a aparecer
