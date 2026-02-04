
# Plano: Reorganizar Categorias + Menu Mobile com Seções

## Situação Atual

**Sidebar Desktop (AppSidebar):**
- Início: Início, Feed, Mapa, Buscar
- Comunicação: Mensagens, Comunidade
- Marketing: Leads
- Conta: Perfil, **Class**, Carteira, Pontos, Suporte
- Administração: Admin (se admin)

**MobileMenuSheet (drawer):** Lista plana sem categorias, todos os itens juntos.

**Problema:** "Class" é treinamentos, não faz sentido em "Conta". E o menu mobile não tem organização por categorias.

---

## Solução

### Parte 1: Nova Categoria "Treinamentos"

Criar categoria **"Treinamentos"** entre "Início" e "Comunicação", e mover "Class" para lá.

**Nova ordem das categorias:**

| Ordem | Categoria | Itens |
|-------|-----------|-------|
| 1 | **Início** | Início, Feed, Mapa, Buscar |
| 2 | **Treinamentos** | Class |
| 3 | **Comunicação** | Mensagens, Comunidade |
| 4 | **Marketing** | Leads |
| 5 | **Conta** | Perfil, Carteira, Pontos, Suporte |
| 6 | **Administração** | Admin (só admins) |

### Parte 2: MobileMenuSheet com Categorias

Transformar o menu mobile de lista plana para lista organizada por seções, igual ao desktop. Cada categoria terá um label visual separando os itens.

**Visual esperado no mobile:**

```text
[Avatar do Usuário]
Nome do Usuário
@username

─────────────────
INÍCIO
  → Início
  → Feed
  → Mapa
  → Buscar
─────────────────
TREINAMENTOS
  → Class
─────────────────
COMUNICAÇÃO
  → Mensagens
  → Comunidade
─────────────────
MARKETING
  → Leads
─────────────────
CONTA
  → Perfil
  → Carteira
  → Pontos
  → Suporte
─────────────────
ADMINISTRAÇÃO (se admin)
  → Admin
```

---

## Arquivos a Modificar

### 1. `src/components/AppSidebar.tsx`

Reorganizar o array `navSections`:

```tsx
const navSections: NavSection[] = [
  {
    label: "Início",
    items: [
      { title: "Início", url: "/app", icon: HomeIcon },
      { title: "Feed", url: "/feed", icon: Newspaper },
      { title: "Mapa", url: "/mapa", icon: MapPin },
      { title: "Buscar", url: "/buscar", icon: Search },
    ],
  },
  {
    label: "Treinamentos",
    items: [
      { title: "Class", url: "/class", icon: Clapperboard },
    ],
  },
  {
    label: "Comunicação",
    items: [
      { title: "Mensagens", url: "/mensagens", icon: Send },
      { title: "Comunidade", url: "/comunidade", icon: MessagesSquare },
    ],
  },
  {
    label: "Marketing",
    items: [
      { title: "Leads", url: "/leads", icon: BarChart3 },
    ],
  },
  {
    label: "Conta",
    items: [
      { title: "Perfil", url: "/perfil", icon: User },
      { title: "Carteira", url: "/carteira", icon: Wallet, placeholder: true },
      { title: "Pontos", url: "/pontos", icon: Gift, placeholder: true },
      { title: "Suporte", url: "/suporte", icon: HelpCircle, placeholder: true },
    ],
  },
];
```

### 2. `src/components/mobile/MobileMenuSheet.tsx`

Mudar de lista plana (`menuItems[]`) para estrutura por seções (`menuSections[]`) e renderizar com labels de categoria:

```tsx
interface MenuSection {
  label: string;
  items: MenuItem[];
}

const menuSections: MenuSection[] = [
  {
    label: "Início",
    items: [
      { title: "Início", url: "/app", icon: Home },
      { title: "Feed", url: "/feed", icon: Newspaper },
      { title: "Mapa", url: "/mapa", icon: MapPin },
      { title: "Buscar", url: "/buscar", icon: Search },
    ],
  },
  {
    label: "Treinamentos",
    items: [
      { title: "Class", url: "/class", icon: Clapperboard },
    ],
  },
  {
    label: "Comunicação",
    items: [
      { title: "Mensagens", url: "/mensagens", icon: Send },
      { title: "Comunidade", url: "/comunidade", icon: MessagesSquare },
    ],
  },
  {
    label: "Marketing",
    items: [
      { title: "Leads", url: "/leads", icon: BarChart3 },
    ],
  },
  {
    label: "Conta",
    items: [
      { title: "Perfil", url: "/perfil", icon: User },
      { title: "Carteira", url: "/carteira", icon: Wallet, placeholder: true },
      { title: "Pontos", url: "/pontos", icon: Gift, placeholder: true },
      { title: "Suporte", url: "/suporte", icon: HelpCircle, placeholder: true },
    ],
  },
];
```

E atualizar a renderização para iterar por seções:

```tsx
<nav className="flex flex-col px-4 py-2">
  {sections.map((section) => (
    <div key={section.label} className="mb-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1 py-2">
        {section.label}
      </p>
      {section.items.map((item) => (
        <button key={item.url} onClick={() => handleNavigate(item)} ...>
          ...
        </button>
      ))}
    </div>
  ))}
</nav>
```

---

## Resumo das Mudanças

| Arquivo | Mudança |
|---------|---------|
| `src/components/AppSidebar.tsx` | Criar categoria "Treinamentos" e mover "Class" para ela; remover "Class" de "Conta" |
| `src/components/mobile/MobileMenuSheet.tsx` | Transformar lista plana em estrutura por seções com labels de categoria |

---

## Testes a Realizar

1. Abrir em desktop e verificar que "Class" aparece na categoria "Treinamentos" (entre Início e Comunicação)
2. Verificar que "Class" não aparece mais em "Conta"
3. Abrir em mobile/tablet, clicar em "Menu" e verificar que as categorias aparecem organizadas
4. Clicar em itens de cada categoria para confirmar navegação funcionando
5. Testar itens placeholder (Carteira, Pontos, Suporte) para confirmar toast "Em breve!"
