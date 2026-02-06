
# Novos Premios + Layout em Grid 3 Colunas + Imagens Geradas por IA

## Resumo

Tres mudancas:
1. **Layout**: Trocar a lista vertical de 1 coluna para um **grid de 3 colunas** na pagina `/pontos`, com cards mais compactos
2. **Premios**: Substituir os 7 premios antigos (Member Invictus, Bronze, etc.) por 5 novos premios reais de alto valor
3. **Imagens**: Criar uma edge function para gerar imagens cinematograficas profissionais para cada premio e salvar no storage

## Novos premios

| Premio | Pontos (provisorio) |
|---|---|
| Resort All Inclusive com Acompanhante | 50.000 |
| iPhone 17 Pro Max | 35.000 |
| MacBook M4 | 45.000 |
| Cruzeiro All Inclusive com Acompanhante | 60.000 |
| Viagem para Paris com Acompanhante, All Inclusive | 75.000 |

## O que muda

### 1. Layout em grid (`src/pages/Pontos.tsx`)

- Trocar `max-w-md` para `max-w-5xl` para comportar 3 colunas
- A lista de cards passara de `space-y-4` para `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4`
- Os skeletons tambem refletirao o grid

### 2. Card compacto (`src/components/pontos/RewardCard.tsx`)

- Reduzir o aspect ratio da imagem de `aspect-[4/5]` para `aspect-[3/4]` para ficar mais proporcional em grid
- Manter a estrutura: imagem + nome + descricao + pontos + botao resgatar

### 3. Banco de dados - Substituir premios

- Deletar os 7 registros antigos da tabela `point_rewards`
- Inserir 5 novos premios com nomes, descricoes curtas e pontuacoes provisorias
- Campo `image_url` ficara inicialmente null ate as imagens serem geradas

### 4. Edge function `generate-reward-images`

Nova edge function (seguindo o mesmo padrao de `generate-recognition-awards`) que:
- Recebe o ID de um premio ou gera para todos
- Usa Lovable AI (`google/gemini-2.5-flash-image`) com prompts cinematograficos especificos para cada premio
- Faz upload das imagens no bucket `reward-images` (storage)
- Atualiza o campo `image_url` de cada premio na tabela `point_rewards`

Prompts profissionais para cada premio:
- **Resort**: Vista aerea de resort tropical luxuoso com piscina infinita, praia cristalina, casal elegante, luz dourada do por do sol
- **iPhone 17 Pro Max**: Produto flutuando em fundo escuro premium, reflexos metalicos, iluminacao de estudio cinematografica
- **MacBook M4**: Laptop aberto em mesa de escritorio premium, fundo escuro, iluminacao lateral dramatica
- **Cruzeiro**: Navio de cruzeiro luxuoso ao entardecer, oceano azul profundo, deck premium iluminado
- **Paris**: Torre Eiffel ao entardecer com casal elegante, luzes douradas, atmosfera cinematografica

### 5. Storage bucket `reward-images`

Criar bucket publico para armazenar as imagens geradas dos premios.

## Sequencia de execucao

1. Criar bucket de storage `reward-images` (migration SQL)
2. Substituir premios no banco (migration SQL - delete antigos + insert novos)
3. Ajustar layout do grid em `Pontos.tsx`
4. Ajustar proporcao do card em `RewardCard.tsx`
5. Criar e deployar edge function `generate-reward-images`
6. Chamar a edge function para gerar as 5 imagens

## Detalhes tecnicos

### Edge function `generate-reward-images/index.ts`

Seguira o mesmo padrao de `generate-recognition-awards`:
- Usa `LOVABLE_API_KEY` (ja configurado) para chamar o AI Gateway
- Usa `SUPABASE_SERVICE_ROLE_KEY` para upload no storage e update na tabela
- Cada imagem e gerada com prompt cinematografico, convertida de base64, e salva no bucket
- Apos upload, atualiza `point_rewards.image_url` com a URL publica

### Migration SQL

```text
-- Criar bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('reward-images', 'reward-images', true);

-- Politica de leitura publica
CREATE POLICY "Public read reward images" ON storage.objects
  FOR SELECT USING (bucket_id = 'reward-images');

-- Deletar premios antigos
DELETE FROM point_rewards;

-- Inserir novos premios
INSERT INTO point_rewards (name, description, points_cost, sort_order, active) VALUES
  ('Resort All Inclusive com Acompanhante', 'Hospedagem premium em resort 5 estrelas com tudo incluso para voce e acompanhante', 50000, 1, true),
  ('iPhone 17 Pro Max', 'O mais recente smartphone da Apple com tecnologia de ponta', 35000, 2, true),
  ('MacBook M4', 'Notebook Apple com chip M4, desempenho profissional incomparavel', 45000, 3, true),
  ('Cruzeiro All Inclusive com Acompanhante', 'Viagem de cruzeiro premium com cabine de luxo e tudo incluso para dois', 60000, 4, true),
  ('Viagem para Paris com Acompanhante - All Inclusive', 'Experiencia completa em Paris com hospedagem, passeios e gastronomia para dois', 75000, 5, true);
```
