

## Ajuste na pagina de Servicos

### O que sera feito

1. **Banco de dados**: Apagar a categoria "Servicos e Produtos" que foi inserida e criar uma nova categoria chamada "Reabilitacao de Credito"
2. **Icone**: Usar o icone `ShieldCheck` do lucide-react para representar reabilitacao de credito (remete a protecao/restauracao financeira)

### Detalhes tecnicos

**SQL a executar:**
```sql
DELETE FROM public.service_categories WHERE name = 'Serviços e Produtos';
INSERT INTO public.service_categories (name, description, icon_name, sort_order)
VALUES ('Reabilitação de Crédito', 'Serviços de reabilitação de crédito', 'shield-check', 0);
```

**Arquivo a modificar:**
- `src/components/servicos/ServiceCategoryCard.tsx` — adicionar suporte para renderizar o icone dinamicamente a partir do campo `icon_name` da categoria (usando o mapa de icones do lucide-react), para que cada categoria mostre seu icone correspondente

### Resultado esperado
A pagina /servicos vai mostrar a categoria "Reabilitacao de Credito" com o icone de shield/check, no lugar da antiga "Servicos e Produtos".

