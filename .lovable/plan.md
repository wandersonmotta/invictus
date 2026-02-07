

## Redesign do topo da pagina de Pontos

### O que muda

Substituir o card atual "Seus pontos" por uma barra horizontal no estilo da referencia, com dois indicadores lado a lado:

```text
+----------------------------------------------+
|  [icone]  Resgatados    [icone]  Meus pontos  |
|              0                      0         |
+----------------------------------------------+
```

- **Resgatados**: quantidade total de resgates do usuario (consultando `point_redemptions`)
- **Meus pontos**: saldo atual de pontos

No mobile, os dois blocos ficam lado a lado na mesma linha (cada um ocupa 50%), mantendo o layout compacto.

### Arquivos a modificar

**1. `src/components/pontos/PointsBalanceCard.tsx`**

Redesenhar o componente para exibir uma barra horizontal com dois blocos:
- Bloco esquerdo: icone de presente + "Resgatados" + contagem
- Bloco direito: fundo escuro/destaque + "Meus pontos" + saldo
- Layout `flex` com `items-center justify-between`

Adicionar nova prop `redeemedCount: number`.

**2. `src/pages/Pontos.tsx`**

- Adicionar query para contar resgates do usuario: `SELECT count(*) FROM point_redemptions WHERE user_id = ...`
- Passar `redeemedCount` para o `PointsBalanceCard`
- Remover o titulo "Premios disponiveis" separado (os cards de premios ja sao autoexplicativos, como na referencia)

### Detalhes tecnicos

Query de resgates:
```sql
SELECT count(*)::int FROM point_redemptions WHERE user_id = auth.uid()
```

Sera feita via `supabase.from("point_redemptions").select("id", { count: "exact", head: true })` filtrado pelo user_id.

Layout responsivo:
- Desktop e mobile: mesma estrutura horizontal, dois blocos lado a lado
- O bloco "Meus pontos" tera fundo escuro (bg-foreground text-background) para destaque, como na referencia

