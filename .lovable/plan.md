

## Plano: Nova Pagina "Reconhecimento" (Premiacoes)

Vou criar uma nova pagina/categoria dedicada ao reconhecimento de membros, seguindo o design das referencias enviadas e o padrao visual Invictus.

---

### Arquitetura

```text
Nova rota: /reconhecimento

Navegacao:
- Adicionar na sidebar (secao "Conta")
- Adicionar na barra mobile (substituir um placeholder ou adicionar no menu)
```

---

### Design Visual (Baseado nas Referencias)

As imagens mostram:
- Carrossel horizontal de premios (placas/trofeus/pulseiras)
- Cada card: imagem do premio + nome do nivel + requisito + pontos
- Niveis progressivos: White, Orange, Green, Blue, Brown

**Adaptacao Invictus:**
- Cores metalicas: Bronze, Silver, Gold, Black, Elite
- Cards com estilo `invictus-surface invictus-frame`
- Scroll horizontal fluido (igual ao Class.tsx)
- Hover premium com glow dourado

---

### Estrutura da Pagina

```text
+-----------------------------------------------+
|  RECONHECIMENTO                               |
|  "O sucesso e construido passo a passo."      |
+-----------------------------------------------+
|                                               |
|  [Bronze] [Silver] [Gold] [Black] [Elite]     |  <- Carrossel horizontal
|                                               |
+-----------------------------------------------+
|                                               |
|  Seu Progresso (opcional, fase 2)             |
|                                               |
+-----------------------------------------------+
```

---

### Arquivos a Criar

#### 1. `src/pages/Reconhecimento.tsx`

Pagina principal com:
- Header (titulo + subtitulo inspiracional)
- Secao de premios em carrossel horizontal
- Cards com imagem, nome, descricao, pontos

#### 2. `src/components/reconhecimento/RecognitionCard.tsx`

Card individual:
- Imagem do premio (placeholder CSS inicial)
- Nome do nivel (ex: "Member Gold")
- Descricao do requisito
- Badge com pontos
- Indicador se conquistado (futuramente)

#### 3. `src/components/reconhecimento/recognitionLevels.ts`

Dados estaticos dos niveis:
- id, name, description, points, color theme
- Pode ser migrado para banco depois

---

### Arquivos a Modificar

#### 4. `src/routing/HostRouter.tsx`

Adicionar nova rota:
```text
/reconhecimento -> <Reconhecimento />
```

#### 5. `src/components/AppSidebar.tsx`

Adicionar item na secao "Conta":
```text
{ title: "Reconhecimento", url: "/reconhecimento", icon: Trophy }
```
(usando icone `Trophy` do Lucide)

#### 6. `src/components/mobile/MobileMenuSheet.tsx`

Adicionar link para "Reconhecimento" na navegacao do menu

#### 7. `src/App.tsx`

Adicionar preloader para a nova pagina

---

### Niveis de Reconhecimento (Proposta)

| Nivel | Nome | Requisito | Pontos | Cor |
|-------|------|-----------|--------|-----|
| 1 | Member Bronze | Entrada na Fraternidade | 100 | Cobre |
| 2 | Member Silver | Acumule R$ 10 mil em resultados | 500 | Prata |
| 3 | Member Gold | Acumule R$ 50 mil em resultados | 1.000 | Dourado |
| 4 | Member Black | Acumule R$ 100 mil em resultados | 2.500 | Preto Premium |
| 5 | Member Elite | Acumule R$ 500 mil em resultados | 5.000 | Dourado Intenso |

(Posso ajustar os nomes/valores conforme sua preferencia)

---

### Design dos Cards (Estilo Class.tsx)

```text
+-------------------+
|                   |
|   [Imagem do      |
|    Premio/Placa]  |
|                   |
+-------------------+
| Member Gold       |
| Acumule R$ 50 mil |
| em resultados     |
+-------------------+
| [1.000 pts]       |
+-------------------+
```

- Aspect ratio: 2:3 (igual aos trainings)
- Scroll horizontal com snap
- Largura responsiva: `clamp(140px, 42vw, 188px)`

---

### Imagens dos Premios

Inicialmente vou criar placeholders visuais usando:
- Gradientes com cores de cada nivel
- Icone de trofeu/medalha (Lucide)
- Fundo premium com efeito metalico

Depois voce pode substituir por fotos reais das placas.

---

### Resultado Esperado

1. Nova pagina `/reconhecimento` acessivel pela sidebar e menu mobile
2. Carrossel horizontal com 5 niveis de premiacao
3. Cards com design premium Invictus (glass + gold frame)
4. Visual consistente com as referencias enviadas
5. Preparado para futura integracao com dados reais

---

### Resumo de Arquivos

```text
Criar:
- src/pages/Reconhecimento.tsx
- src/components/reconhecimento/RecognitionCard.tsx
- src/components/reconhecimento/recognitionLevels.ts

Editar:
- src/routing/HostRouter.tsx (adicionar rota)
- src/components/AppSidebar.tsx (adicionar nav item)
- src/components/mobile/MobileMenuSheet.tsx (adicionar link)
- src/App.tsx (adicionar preloader)
```

