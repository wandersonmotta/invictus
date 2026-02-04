
# Plano: Adicionar Carteira, Pontos e Suporte na Sidebar Desktop

## Situação Atual

O **MobileBottomNav** (menu inferior para celulares/tablets) possui:
- **Início** → `/app` (funcional)
- **Carteira** → placeholder (sem página ainda)
- **Pontos** → placeholder (sem página ainda)
- **Suporte** → placeholder (sem página ainda)
- **Menu** → abre drawer com navegação completa

A **AppSidebar** (barra lateral desktop/notebook) possui:
- Início, Feed, Mapa, Buscar
- Mensagens, Comunidade
- Leads
- Perfil, Class
- Admin (se aplicável)

**Problema:** Carteira, Pontos e Suporte não estão na sidebar desktop.

---

## Solução

Adicionar os três itens na sidebar desktop na categoria **"Conta"**, já que são funcionalidades relacionadas ao usuário individual. Por enquanto, como são placeholders:

1. Clicar nesses itens vai mostrar um toast "Em breve!"
2. Quando as páginas forem criadas, basta remover a marcação de placeholder

---

## Organização Proposta da Sidebar

| Categoria | Itens |
|-----------|-------|
| **Início** | Início, Feed, Mapa, Buscar |
| **Comunicação** | Mensagens, Comunidade |
| **Marketing** | Leads |
| **Conta** | Perfil, Class, Carteira, Pontos, Suporte |
| **Administração** | Admin (só admins) |

---

## Arquivo a Modificar

### `src/components/AppSidebar.tsx`

**Mudanças:**

1. Importar os ícones necessários:
```tsx
import { Wallet, Gift, HelpCircle } from "lucide-react";
```

2. Adicionar os novos itens na seção "Conta":
```tsx
{
  label: "Conta",
  items: [
    { title: "Perfil", url: "/perfil", icon: User },
    { title: "Class", url: "/class", icon: Clapperboard },
    { title: "Carteira", url: "/carteira", icon: Wallet, placeholder: true },
    { title: "Pontos", url: "/pontos", icon: Gift, placeholder: true },
    { title: "Suporte", url: "/suporte", icon: HelpCircle, placeholder: true },
  ],
},
```

3. Modificar o handler de clique para mostrar toast em placeholders:
```tsx
const handleNavClick = (e: React.MouseEvent, isPlaceholder?: boolean) => {
  if (isPlaceholder) {
    e.preventDefault();
    toast.info("Em breve!", {
      description: "Esta funcionalidade está sendo desenvolvida.",
    });
    return;
  }
  if (isMobile) setOpenMobile(false);
};
```

4. Passar a flag `placeholder` para o componente de link e aplicar o comportamento

---

## Consistência com Mobile

Também vou adicionar esses mesmos itens no **MobileMenuSheet** (menu drawer que abre ao clicar em "Menu"):

### `src/components/mobile/MobileMenuSheet.tsx`

Adicionar Carteira, Pontos e Suporte na lista de itens do menu drawer para que fiquem disponíveis também quando o usuário abre o menu completo no mobile.

---

## Resumo de Mudanças

| Arquivo | Mudança |
|---------|---------|
| `src/components/AppSidebar.tsx` | Adicionar Carteira, Pontos, Suporte na categoria "Conta" com comportamento de placeholder |
| `src/components/mobile/MobileMenuSheet.tsx` | Adicionar os mesmos itens para consistência no drawer mobile |

---

## Visual Esperado

**Sidebar Desktop (categoria Conta):**
```
CONTA
├── Perfil
├── Class  
├── Carteira ★ (em breve)
├── Pontos ★ (em breve)
└── Suporte ★ (em breve)
```

Os itens marcados como placeholder terão o mesmo comportamento visual, mas ao clicar mostram o toast "Em breve!" ao invés de navegar.

---

## Testes a Realizar

1. Abrir em desktop (≥1024px) e verificar que Carteira, Pontos e Suporte aparecem na sidebar
2. Clicar em cada um e confirmar que o toast "Em breve!" aparece
3. Abrir em tablet/mobile e verificar que os itens também aparecem no menu drawer
4. Confirmar que a navegação para rotas existentes continua funcionando normalmente
