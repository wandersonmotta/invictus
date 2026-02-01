
# Plano: Campos Obrigatórios no Onboarding + CEP em Tempo Real + Bloqueio Pós-Preenchimento

## Objetivo
Garantir que novos membros (status `pending`) preencham obrigatoriamente foto, nome, sobrenome, CEP, bio e pelo menos 1 expertise **antes** de salvar. Após salvar, o formulário fica bloqueado para edição até a aprovação do administrador. A tela de "Aguardando Aprovação" exibirá uma mensagem impactante e não mais oferecerá link para editar perfil.

---

## Escopo das Alterações

### 1. CEP em Tempo Real (Live Lookup)
**Arquivo:** `src/components/profile/ProfileForm.tsx`

**Problema atual:** Cidade/Estado só aparecem após clicar "Salvar perfil".

**Solução:**
- Adicionar um `useEffect` que observa o campo `postal_code` do formulário
- Quando o CEP tiver 8 dígitos válidos, disparar uma chamada à API ViaCEP diretamente no front (apenas para exibição imediata)
- Preencher os campos `city` e `state` localmente (estado local, não o profile do banco)
- A chamada ao edge function `resolve-location-from-cep` continua sendo feita no submit para salvar no banco

**Implementação:**
```text
Estado local: liveCep = { city, state, loading, error }

useEffect:
  - watch("postal_code") → quando tiver 8 dígitos
  - fetch("https://viacep.com.br/ws/{cep}/json/")
  - se válido: setLiveCep({ city, state, ... })
  - se erro: limpar city/state
```

---

### 2. Novos Campos Obrigatórios para Usuários Pendentes
**Arquivo:** `src/components/profile/ProfileForm.tsx`

**Campos que passam a ser obrigatórios apenas para `access_status !== "approved"`:**
- `avatar_url` (foto)
- `first_name` / `last_name` (já obrigatórios)
- `postal_code` (já obrigatório)
- `bio` (novo: mínimo 1 caractere)
- `expertises` (novo: pelo menos 1 item)

**Implementação:**
- Detectar `isOnboarding = accessStatus !== "approved"`
- Se `isOnboarding`, aplicar validação extra no `onSubmit`:
  - Verificar `avatar_url` não é null
  - Verificar `bio` tem pelo menos 1 caractere
  - Verificar `expertises` tem pelo menos 1 item
- Exibir erros visuais próximos aos campos

---

### 3. Bloqueio de Edição Após Salvar (para Pendentes)
**Arquivo:** `src/components/profile/ProfileForm.tsx`

**Lógica:**
- Nova flag: `isProfileReadyForReview`
  - `true` se `access_status !== "approved"` **E** todos os campos obrigatórios estão preenchidos (avatar, nome, sobrenome, CEP, bio, expertise)
- Se `isProfileReadyForReview`:
  - Desabilitar todos os inputs
  - Esconder botão "Salvar perfil"
  - Exibir mensagem: "Seu perfil foi enviado para análise. Aguarde a aprovação."

**Arquivo:** `src/pages/Perfil.tsx`
- Ocultar tabs "Editar perfil" / "Ver como fica" quando `isProfileReadyForReview`
- Exibir apenas a visualização do perfil com mensagem de aguardo

---

### 4. Nova Tela de Aguardando Aprovação
**Arquivo:** `src/pages/AguardandoAprovacao.tsx`

**Alterações:**
- **Remover** o botão "Completar perfil" e texto incentivando edição
- **Nova mensagem** destacada:
  ```
  Olá, futuro membro Invictus!
  
  Você, a partir desse momento, vai fazer parte de algo grandioso.
  Aguarde enquanto validamos o seu convite e o seu usuário.
  ```
- Usar estilo `invictus-auth-surface invictus-auth-frame` (moldura dourada premium)
- Layout centralizado, com logo e tipografia impactante

---

### 5. Ajuste no RequireAuth para Verificar Campos Completos
**Arquivo:** `src/auth/RequireAuth.tsx`

**Alteração:**
- Expandir a query para incluir: `avatar_url`, `bio`, `expertises`, `postal_code`
- Novo cálculo de `profileComplete`:
  ```
  profileComplete = firstName && lastName && avatar_url && bio && expertises.length > 0 && postal_code
  ```
- Se `profileComplete === false` e `access_status !== "approved"`:
  - Redirecionar para `/perfil`
- Se `profileComplete === true` e `access_status !== "approved"`:
  - Redirecionar para `/aguardando-aprovacao`

---

## Fluxo do Usuário

```text
1. Usuário cria conta com convite → status = "pending"
2. Sistema redireciona para /perfil (campos obrigatórios não preenchidos)
3. Usuário preenche: foto, nome, sobrenome, CEP (cidade/estado aparecem em tempo real), bio, expertises
4. Clica em "Salvar perfil"
5. Formulário fica bloqueado (não pode mais editar)
6. Sistema redireciona para /aguardando-aprovacao
7. Tela exibe mensagem impactante sem opção de editar
8. Administrador aprova → status = "approved"
9. Polling detecta aprovação → redireciona para /app
10. Usuário agora pode editar perfil normalmente em /perfil
```

---

## Arquivos Envolvidos

| Arquivo | Alteração |
|---------|-----------|
| `src/components/profile/ProfileForm.tsx` | CEP live lookup, validação extra, bloqueio de edição |
| `src/pages/Perfil.tsx` | Ocultar tabs quando perfil bloqueado |
| `src/pages/AguardandoAprovacao.tsx` | Nova mensagem premium, remover link de edição |
| `src/auth/RequireAuth.tsx` | Expandir verificação de campos obrigatórios |

---

## Detalhes Técnicos

### CEP Live Lookup (novo hook/efeito)
```typescript
const [liveCep, setLiveCep] = useState<{ city: string; state: string; loading: boolean; error: string | null }>({
  city: "", state: "", loading: false, error: null,
});

const watchedCep = form.watch("postal_code");

useEffect(() => {
  const digits = (watchedCep ?? "").replace(/\D/g, "");
  if (digits.length !== 8) {
    setLiveCep({ city: "", state: "", loading: false, error: null });
    return;
  }
  
  setLiveCep(prev => ({ ...prev, loading: true, error: null }));
  
  fetch(`https://viacep.com.br/ws/${digits}/json/`)
    .then(r => r.json())
    .then(data => {
      if (data.erro) {
        setLiveCep({ city: "", state: "", loading: false, error: "CEP não encontrado" });
      } else {
        setLiveCep({ city: data.localidade, state: data.uf, loading: false, error: null });
      }
    })
    .catch(() => {
      setLiveCep({ city: "", state: "", loading: false, error: "Erro ao buscar CEP" });
    });
}, [watchedCep]);
```

### Validação de Campos Obrigatórios para Pendentes
```typescript
const isOnboarding = accessStatus !== "approved";
const hasAvatar = Boolean(profile?.avatar_url);
const hasBio = (values.bio ?? "").trim().length > 0;
const hasExpertise = normalizeExpertises(values.expertisesCsv).length > 0;

if (isOnboarding) {
  const errors: string[] = [];
  if (!hasAvatar) errors.push("Foto de perfil é obrigatória");
  if (!hasBio) errors.push("Bio é obrigatória");
  if (!hasExpertise) errors.push("Adicione pelo menos 1 expertise");
  
  if (errors.length > 0) {
    toast({ title: "Campos obrigatórios", description: errors.join(". "), variant: "destructive" });
    return;
  }
}
```

### Tela AguardandoAprovacao (nova estrutura)
```tsx
<main className="min-h-svh grid place-items-center p-4 sm:p-6">
  <AuthBackground />
  <div className="invictus-auth-surface invictus-auth-frame w-full max-w-lg rounded-2xl p-8 text-center">
    <img src={logo} alt="Invictus" className="mx-auto h-16 mb-4" />
    <h1 className="text-2xl font-bold mb-4">Olá, futuro membro Invictus!</h1>
    <p className="text-lg text-muted-foreground mb-6">
      Você, a partir desse momento, vai fazer parte de algo grandioso.
    </p>
    <p className="text-sm text-muted-foreground">
      Aguarde enquanto validamos o seu convite e o seu usuário.
    </p>
    <Button variant="secondary" onClick={signOut} className="mt-8">Sair</Button>
  </div>
</main>
```

---

## Risco/Impacto
- **Baixo risco**: alterações isoladas no fluxo de onboarding
- **Impacto positivo**: garante que todos os membros tenham perfis completos antes da aprovação

## Critério de Aceite
1. CEP preenchido → cidade/estado aparecem imediatamente (sem salvar)
2. Usuário pendente não consegue salvar sem foto, bio e expertise
3. Após salvar, perfil fica bloqueado para edição (status pending)
4. Tela /aguardando-aprovacao exibe mensagem premium sem link para editar
5. Após aprovação, usuário pode editar perfil normalmente (mas campos obrigatórios continuam obrigatórios)
