

# Plano: Corrigir Bug dos Dois X e Bug do Duplo @@

## Problema 1: Dois botões X no Menu Mobile

### Causa Raiz
O componente `SheetContent` do shadcn/ui **já inclui um botão X** automaticamente no seu código interno (linha 60-63 de `sheet.tsx`). Quando criamos o `MobileMenuSheet`, adicionamos **outro botão X manual** (linhas 112-118), resultando em dois ícones X.

### Solução
Remover o botão X manual do `MobileMenuSheet.tsx` e deixar apenas o X nativo do `SheetContent`.

### Arquivo: `src/components/mobile/MobileMenuSheet.tsx`

Remover este bloco (linhas 111-118):
```tsx
{/* Close button */}
<button
  onClick={() => onOpenChange(false)}
  className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted/50 transition-colors z-10"
  aria-label="Fechar menu"
>
  <X className="h-5 w-5 text-muted-foreground" />
</button>
```

E remover a importação do `X` que agora não será mais usada neste componente.

---

## Problema 2: Duplo @@ no Username

### Causa Raiz
Conforme a documentação do projeto, os handles são armazenados no banco de dados **já com o prefixo @** (ex: `@wandersonmota`). No `MobileMenuSheet.tsx`, linha 129, estamos renderizando:

```tsx
<p className="text-sm text-muted-foreground">@{username}</p>
```

Isso adiciona um segundo `@`, resultando em `@@wandersonmota`.

### Solução
Exibir o `username` diretamente, sem adicionar `@`:

```tsx
<p className="text-sm text-muted-foreground">{username}</p>
```

### Arquivo: `src/components/mobile/MobileMenuSheet.tsx`

Linha 129 - alterar de:
```tsx
<p className="text-sm text-muted-foreground">@{username}</p>
```

Para:
```tsx
<p className="text-sm text-muted-foreground">{username}</p>
```

---

## Problema 3: Prevenção na Entrada do Username (Perfil)

### Causa Raiz
O campo de username no `ProfileForm.tsx` permite que o usuário digite `@` manualmente. Como a função `normalizeUsernameInput` adiciona `@` se não existir, se o usuário digitar `@wandersonmota`, o banco vai receber `@@wandersonmota` em alguns casos (apesar de haver validação, pode gerar confusão).

### Solução
Modificar o input do username para:
1. Exibir um prefixo visual `@` **fixo antes do input** (como um addon)
2. Remover qualquer `@` que o usuário digite no campo (sanitizar automaticamente)
3. Manter a lógica de normalização no `onBlur` para adicionar `@` antes de salvar

### Arquivo: `src/components/profile/ProfileForm.tsx`

Alterar a estrutura do campo username (linhas 561-582):

**De:**
```tsx
<div className="space-y-2">
  <Label htmlFor="username">@ do usuário</Label>
  <Input
    id="username"
    placeholder="@seu.usuario"
    {...form.register("username", {
      onBlur: (e) => {
        const normalized = normalizeUsernameInput(e.target.value) ?? "";
        form.setValue("username", normalized, ...);
      },
    })}
  />
</div>
```

**Para:**
```tsx
<div className="space-y-2">
  <Label htmlFor="username">@ do usuário</Label>
  <div className="flex items-center">
    <span className="flex h-10 items-center justify-center rounded-l-md border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground">
      @
    </span>
    <Input
      id="username"
      className="rounded-l-none"
      placeholder="seu.usuario"
      {...form.register("username", {
        onChange: (e) => {
          // Remove any @ characters the user types
          const clean = e.target.value.replace(/@/g, "");
          form.setValue("username", clean, { shouldValidate: false });
        },
        onBlur: (e) => {
          const value = e.target.value.replace(/@/g, "").trim();
          const normalized = value ? `@${value}` : "";
          form.setValue("username", normalized, ...);
        },
      })}
    />
  </div>
</div>
```

Também ajustar a função `normalizeUsernameInput` para remover múltiplos `@`:

```tsx
function normalizeUsernameInput(v: string | undefined) {
  // Remove all @ characters first, then add single @
  const raw = (v ?? "").trim().toLowerCase().replace(/@/g, "");
  if (!raw) return null;
  return `@${raw}`;
}
```

---

## Resumo de Arquivos

| Arquivo | Mudança |
|---------|---------|
| `src/components/mobile/MobileMenuSheet.tsx` | Remover botão X manual + remover `@` extra na exibição do username |
| `src/components/profile/ProfileForm.tsx` | Adicionar prefixo visual `@` + sanitizar input + ajustar normalização |

---

## Resultado Esperado

1. **Menu Mobile** - Apenas um X para fechar (o nativo do Sheet)
2. **Username no Menu** - Exibe `@wandersonmota` (sem duplicação)
3. **Formulário de Perfil** - Usuário vê `@` como prefixo fixo e digita apenas `seu.usuario`, impossibilitando entrada de `@` duplicado

---

## Testes a Realizar

1. Abrir o menu mobile e verificar que há apenas um X
2. Verificar que o username aparece correto (sem `@@`)
3. Testar criação/edição de perfil digitando `@` no campo - deve ser removido automaticamente
4. Salvar perfil e confirmar que o banco recebe `@usuario` corretamente

