

## Adicionar o servico "Limpa Nome" com layout responsivo

### O que sera feito

1. **Banco de dados**: Adicionar coluna `icon_name` na tabela `service_items` e inserir o item "Limpa Nome" na categoria "Reabilitacao de Credito"
2. **Layout responsivo**: Redesenhar o `ServiceItemCard` para dois modos:
   - **Desktop**: Cards quadrados com icone, dispostos lado a lado em grid (2-3 colunas)
   - **Mobile**: Lista vertical com bullet/icone organizado, um item abaixo do outro

### Detalhes tecnicos

**Migracao SQL:**
```sql
ALTER TABLE public.service_items ADD COLUMN icon_name text;

INSERT INTO public.service_items (category_id, name, description, icon_name, sort_order)
VALUES (
  '7d687880-aca2-489b-97a3-e511fa33d0bc',
  'Limpa Nome',
  'Servico de limpeza de nome e regularizacao cadastral',
  'eraser',
  0
);
```

**Arquivos a modificar:**

- `src/components/servicos/ServiceItemCard.tsx` — redesenhar o card:
  - Adicionar prop `iconName` e usar o mesmo `iconMap` para renderizar icones
  - Desktop: card quadrado/arredondado com icone centralizado em cima e nome embaixo
  - Mobile: layout em lista horizontal (icone + nome + descricao) compacto

- `src/pages/Servicos.tsx` — ajustar o grid dos itens:
  - Desktop: `grid-cols-2 sm:grid-cols-3` para cards lado a lado
  - Mobile: `flex flex-col gap-2` para lista vertical
  - Adicionar `icon_name` ao select da query e passar para o componente
  - Usar o hook `useIsMobile` para alternar entre os dois layouts

### Resultado esperado
- Desktop: cards quadrados com cantos arredondados, icone + nome, dispostos em grade lado a lado
- Mobile: lista organizada verticalmente, cada item com icone e nome em linha
