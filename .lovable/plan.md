

# Atualizar Imagens dos Premios (Resort, iPhone, MacBook)

## Resumo

Atualizar os prompts de geracao de imagem para 3 dos 5 premios, tornando-os mais realistas e especificos. Os outros 2 (Cruzeiro e Paris) permanecem como estao.

## O que muda

### 1. Resort All Inclusive -- Porto de Galinhas, Pernambuco

Prompt atual: resort generico tropical.
Novo prompt: resort real em **Porto de Galinhas**, com piscinas naturais, recifes de coral, mar verde-esmeralda tipico da regiao, coqueiros, e arquitetura de resort pe-na-areia no estilo Nannai ou Summerville. Referencia geografica clara de Pernambuco.

### 2. iPhone 17 Pro Max -- Cor laranja/desert titanium

Prompt atual: smartphone generico com acabamento titanio.
Novo prompt: **iPhone 17 Pro Max** especifico, na cor **laranja/desert titanium**, com o design real (ilha de camera redesenhada, bordas finas, corpo em titanio). Foco na identidade visual real do produto Apple.

### 3. MacBook M4 -- Design real Apple

Prompt atual: laptop generico premium.
Novo prompt: **MacBook Pro com chip M4** real, com o design Apple reconhecivel (corpo unibody em aluminio espacial, tela Liquid Retina XDR, teclado preto, logo Apple na tampa). Visual autentico do produto.

### 4. Cruzeiro -- Manter como esta (sem alteracao)

### 5. Paris -- Manter como esta (sem alteracao)

## Sequencia de execucao

1. Atualizar os 3 prompts na edge function `generate-reward-images/index.ts`
2. Deployar a edge function
3. Chamar a edge function para regenerar as 3 imagens (uma por vez, passando o `reward_id` de cada)
4. Verificar se as novas imagens foram salvas corretamente

## Detalhes tecnicos

### Novos prompts

**Resort (Porto de Galinhas)**:
```text
Cinematic aerial photograph of a luxury beachfront resort in Porto de Galinhas, 
Pernambuco, Brazil. Crystal-clear emerald-green natural pools formed by coral 
reefs along the white sand beach. Coconut palm trees lining the shore. 
Premium resort architecture with infinity pool overlooking the ocean. 
Golden hour sunset light. Warm tropical tones. Professional travel photography, 
4K quality, luxury hospitality advertising style.
```

**iPhone 17 Pro Max (laranja)**:
```text
Professional product photography of an Apple iPhone 17 Pro Max in Desert 
Titanium orange color. The phone displays its redesigned camera island with 
aluminum frame. Thin bezels, titanium body with matte orange finish. 
Floating against a deep black gradient background. Cinematic studio lighting 
with soft rim light. Ultra-clean minimal composition, 4K quality, 
Apple product advertising style.
```

**MacBook M4**:
```text
Professional product photography of an Apple MacBook Pro M4 laptop, open at 
an angle showing the Liquid Retina XDR display and black keyboard. Space gray 
aluminum unibody design with Apple logo on the lid. Clean dark gradient 
background. Cinematic studio lighting with soft reflections on the aluminum 
surface. Ultra-clean minimal composition, 4K quality, Apple product 
advertising style.
```

### Edge function

Apenas os 3 prompts no dicionario `REWARD_PROMPTS` serao alterados. A logica da funcao permanece identica.

### Geracao das imagens

Apos o deploy, chamarei a edge function 3 vezes (uma para cada `reward_id`) para regenerar apenas os premios alterados:
- Resort: `81923ed1-ee68-4330-b2a0-67730ece8b8d`
- iPhone: `bf43626e-1102-4954-bbe1-3ef2de8f4d53`
- MacBook: `f4dc0328-e4cb-47ff-9160-aed7b225c981`

