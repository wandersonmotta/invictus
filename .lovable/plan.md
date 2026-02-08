
# Plano: Avatar feminino cinematografico para a IA do Suporte

## Objetivo

Gerar uma imagem realista estilo cinematografico de uma mulher com fone de ouvido para representar a assistente IA do Suporte Invictus. Essa imagem sera usada como avatar em todos os pontos onde a IA aparece no chat.

## O que sera feito

### 1. Gerar a imagem via Edge Function

Criar uma Edge Function `generate-support-avatar` que usa o modelo de geracao de imagens (Gemini Flash Image) para criar a foto. O prompt sera algo como:

> "Cinematic studio portrait of a professional Brazilian woman wearing a modern headset, warm lighting, shallow depth of field, friendly smile, dark background with subtle gold accents, high-end corporate look"

A imagem gerada sera salva no bucket de storage (ex: `support-assets`) e a URL publica sera usada no codigo.

### 2. Salvar a imagem no storage

- Criar bucket `support-assets` (publico) via migration
- A Edge Function faz upload do base64 para `support-assets/ai-avatar.jpg`
- A URL publica fica disponivel para uso no frontend

### 3. Atualizar o frontend

Substituir o icone `Bot` pelo avatar da IA em 3 pontos:

| Arquivo | Local | Mudanca |
|---------|-------|---------|
| `SupportAIChatPopup.tsx` | Header do chat (linha 175) | Trocar icone Bot por Avatar com imagem |
| `SupportAIChatPopup.tsx` | Bolhas de mensagem da IA (linha 198) | Trocar icone Bot por Avatar com imagem |
| `SupportMessageBubble.tsx` | Icone para `senderType === "ai"` (linha ~80) | Usar a imagem como avatar da IA |

### 4. Constante centralizada

Criar uma constante para a URL do avatar da IA em um arquivo de config para facilitar manutencao futura:

```text
src/config/supportAvatar.ts
  -> export const AI_SUPPORT_AVATAR_URL = "https://[supabase-url]/storage/v1/object/public/support-assets/ai-avatar.jpg";
```

## Detalhes Tecnicos

### Edge Function: `generate-support-avatar`

- Usa `google/gemini-2.5-flash-image` via Lovable AI gateway
- Prompt focado em: mulher brasileira, fone de ouvido, iluminacao cinematografica, fundo escuro com tons dourados
- Faz upload do resultado para o bucket `support-assets`
- Funcao executada uma unica vez (manualmente ou via curl)

### Migration SQL

```text
INSERT INTO storage.buckets (id, name, public) VALUES ('support-assets', 'support-assets', true);

CREATE POLICY "Public read support assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'support-assets');

CREATE POLICY "Service role upload support assets"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'support-assets');
```

### Ordem de execucao

1. Migration para criar bucket
2. Criar e executar Edge Function para gerar a imagem
3. Atualizar `SupportAIChatPopup.tsx` e `SupportMessageBubble.tsx` com o avatar
4. Criar `src/config/supportAvatar.ts` com a URL centralizada
