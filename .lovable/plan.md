
# Novo nível "Member Invictus" + Atualização dos requisitos

## Resumo
Adicionar um novo primeiro nível **"Member Invictus"** (pulseira, requisito: adicionar 3 pessoas) e atualizar os valores de requisito dos demais níveis.

## Novos valores dos níveis (7 no total)

| # | ID | Nome | Requisito | Prêmio |
|---|-----|------|-----------|--------|
| 1 | invictus | Member Invictus | Adicione 3 pessoas | Pulseira |
| 2 | bronze | Member Bronze | R$ 10 mil em resultados | Placa |
| 3 | silver | Member Silver | R$ 30 mil em resultados | Placa |
| 4 | gold | Member Gold | R$ 100 mil em resultados | Placa |
| 5 | black | Member Black | R$ 250 mil em resultados | Placa |
| 6 | elite | Member Elite | R$ 500 mil (sem alteração) | Placa |
| 7 | diamond | Member Diamond | R$ 1 milhão (sem alteração) | Placa |

## O que será feito

### 1. Gerar imagem da pulseira via IA
- Atualizar a edge function `generate-recognition-awards` para incluir o nível `invictus` com um prompt específico para uma **pulseira premium** (não placa de acrílico) com o texto "MEMBER INVICTUS" e estilo Invictus (dourado/preto, luxo).
- Chamar a function para gerar a imagem e fazer upload no storage.

### 2. Atualizar `recognitionLevels.ts`
- Adicionar o novo nível `invictus` como primeiro item do array, com gradient preto/dourado e a URL da imagem gerada.
- Atualizar os requisitos/descrições dos demais níveis:
  - Bronze: R$ 10 mil
  - Silver: R$ 30 mil
  - Gold: R$ 100 mil
  - Black: R$ 250 mil
  - Elite e Diamond: mantidos

### 3. Atualizar a edge function
- Adicionar config do nível `invictus` no `LEVEL_CONFIGS` com prompt diferenciado (pulseira em vez de placa).
- Atualizar a mensagem de erro para incluir "invictus" na lista de níveis válidos.

### Pontuação do novo nível
- Será definida como **50 pts** (abaixo dos 100 do Bronze), mantendo a progressão.

---

## Detalhes Técnicos

**Arquivos alterados:**
- `supabase/functions/generate-recognition-awards/index.ts` -- adicionar nível "invictus" com prompt de pulseira
- `src/components/reconhecimento/recognitionLevels.ts` -- adicionar nível + atualizar requisitos

**Prompt da pulseira (IA):**
Pulseira premium preta com detalhes dourados, texto "MEMBER INVICTUS" gravado, estilo luxo/business, mesma estética de produto (fundo escuro, iluminação de estúdio, 4K).

**Sequência:**
1. Editar a edge function com o novo nível
2. Deploy da function
3. Chamar a function para gerar a imagem da pulseira
4. Atualizar `recognitionLevels.ts` com a URL gerada e os novos requisitos
