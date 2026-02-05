
# Plano: Adicionar Opção "Padrão do Sistema" no Toggle de Tema

## Situação Atual

O sistema já está configurado para suportar o tema do sistema operacional:
- `defaultTheme="system"` no ThemeProvider
- `enableSystem={true}` habilitado

**Problema**: O toggle no menu do usuário (`UserMenu.tsx`) só alterna entre "dark" e "light" diretamente com `setTheme()`, fazendo o usuário perder a opção de usar o padrão do sistema.

## Solução

Substituir o item único de toggle por um **ToggleGroup com 3 opções**:
1. **Sistema** (ícone Monitor) - segue a preferência do SO
2. **Claro** (ícone Sol) - sempre claro
3. **Escuro** (ícone Lua) - sempre escuro

## Mudanças Técnicas

### Arquivo: `src/components/UserMenu.tsx`

1. **Importar componentes adicionais:**
   - `Monitor` do lucide-react (ícone para "Sistema")
   - `ToggleGroup` e `ToggleGroupItem` dos componentes UI

2. **Usar `theme` ao invés de apenas `resolvedTheme`:**
   - `theme` = valor configurado ("system", "light", "dark")
   - `resolvedTheme` = valor aplicado (só "light" ou "dark")

3. **Substituir o DropdownMenuItem de toggle por um ToggleGroup:**
   ```text
   ┌─────────────────────────────────────────┐
   │  [🖥️]  [☀️]  [🌙]                        │
   │  Sistema  Claro  Escuro                 │
   └─────────────────────────────────────────┘
   ```

4. **Comportamento:**
   - Clique em qualquer opção → `setTheme("system" | "light" | "dark")`
   - A opção selecionada fica destacada
   - Preferência salva automaticamente no localStorage (`invictus-theme`)

## Fluxo de Persistência

```text
Usuário seleciona tema
        │
        ▼
setTheme("system" | "light" | "dark")
        │
        ▼
Salvo em localStorage "invictus-theme"
        │
        ▼
Próximo acesso → ThemeProvider lê do storage
        │
        ▼
Aplica tema salvo (ou padrão do sistema se nunca alterou)
```

## Comportamento Final

| Configuração | SO do usuário | Tema aplicado |
|--------------|---------------|---------------|
| Sistema      | Claro         | Claro         |
| Sistema      | Escuro        | Escuro        |
| Claro        | Qualquer      | Claro         |
| Escuro       | Qualquer      | Escuro        |

## Notas

- **Novos usuários**: Começam com "Sistema" (padrão do ThemeProvider)
- **Usuários existentes** que já usaram o toggle: Terão "light" ou "dark" salvo, mas podem mudar para "Sistema"
- **Páginas públicas** (Landing, Auth): Continuam forçadas em dark independente da escolha
