
## Por que ainda não “criei”?
Porque eu estava aguardando as decisões de produto (escopo, entrada por convite + aprovação, como “conectar”, e como o mapa funciona). Agora você já definiu: **MVP completo (D)**, **cadastro só com código + aprovação**, **DM estilo Instagram com “solicitações”**, e **mapa com “perto de mim”**. Com isso, já dá para implementar com clareza (e sem retrabalho).

---

## Plano de implementação — Invictus (dark + gold + glass, alto padrão)

### 1) Fundamento do produto (branding + layout)
- Definir identidade “Invictus / Fraternidade”: tipografia, tons **dark** com **dourado** e efeito **glassmorphism** (cards translúcidos, blur, bordas sutis).
- Criar estrutura base de navegação:
  - **Home/Mapa**
  - **Buscar**
  - **Mensagens**
  - **Perfil**
  - **Admin (apenas para admins)**

### 2) Acesso restrito: código + aprovação (fraternidade fechada)
**Experiência do usuário**
- Tela “Entrar no Invictus”:
  - Campo para **código de convite**
  - Cadastro (email/senha) ou login
- Após cadastro com código: status **“Em análise”** até aprovação.
- Quando aprovado: acesso total ao app.

**Regras**
- Só consegue se cadastrar quem tiver **código válido**.
- Mesmo com código, a conta entra como **pendente** até um admin aprovar.

### 3) Perfis de membros (o coração do networking)
- Perfil com:
  - Nome / foto
  - Bio curta (executivo)
  - **Expertises** (tags: design, vídeo, dev, marketing etc.)
  - Área de atuação / setor
  - Região (cidade/estado) e opção de visibilidade
- Edição de perfil guiada (onboarding rápido após aprovação).

### 4) Mapa “Perto de mim” (raio, sem expor ponto exato)
- Mapa inicial mostrando:
  - Pessoas dentro de um **raio configurável** (ex.: 5–50km)
  - Pin/cluster sem revelar localização precisa
- Ações no mapa:
  - Clicar em um membro → abrir card com resumo + botão **“Ver perfil”** + **“Enviar mensagem”**
- Filtros integrados ao mapa:
  - Expertise (tags)
  - Região
  - “Somente aprovados” (padrão)

### 5) Busca (diretório premium)
- Tela de busca com:
  - Barra de pesquisa
  - Filtros por expertise, região, setor
  - Cards premium (avatar, nome, headline, tags)
- CTA direto: **Enviar mensagem** ou **Ver perfil**.

### 6) Networking e DM (modelo “Instagram”: solicitações + chat)
**Fluxo de mensagens**
- Se você ainda não tem relacionamento com a pessoa:
  - Ao enviar DM → cai em **Solicitações de conversa** do destinatário.
  - Destinatário pode **aceitar** (vira conversa normal) ou **recusar/bloquear**.
- Se já existe relacionamento (ex.: “se seguem”/conexão aprovada):
  - Mensagens vão direto para a **Caixa de entrada** normal.

**Telas**
- Mensagens:
  - Aba **Inbox**
  - Aba **Solicitações**
- Conversa:
  - UI limpa, dark/gold, com envio de texto (começar simples: texto; depois anexos).

**Como definir “quem já se segue”**
- Implementar um sistema simples de relacionamento:
  - Opção A (recomendado para começar): **Follow** (seguir/ser seguido)
  - Regras: “DM direto” apenas quando **ambos** se seguem (seguimento recíproco) — fica intuitivo e parecido com redes sociais.

### 7) Painel Admin (aprovação e gestão da fraternidade)
- Tela Admin com:
  - Lista de **cadastros pendentes**
  - Aprovar / Rejeitar
  - Gestão de **códigos de convite** (criar, expirar, limitar usos)
- Segurança:
  - Sistema de **roles em tabela separada** (admin/moderator/user), com checagem no backend (sem depender do client).

### 8) Segurança, validações e qualidade
- Validação de todos os formulários (cadastro, código, perfil, envio de mensagem) com mensagens claras.
- Regras para evitar abuso:
  - Limites básicos (tamanho de bio, tags, mensagens, tentativas de código).
- Privacidade do mapa:
  - Apenas “perto de mim” por raio, sem armazenar/mostrar endereço exato.
- Estados do sistema bem definidos:
  - Não logado → Auth
  - Logado mas pendente → “Aguardando aprovação”
  - Aprovado → app completo

### 9) Polimento “alto padrão”
- Microinterações: transições suaves, hover states em dourado, sombras leves, glass cards.
- Responsivo (mobile-first): mapa e mensagens funcionando bem no celular.
- Empty states elegantes (sem cara de app “em branco”).

### 10) Checklist de entrega (o que você vai testar no final)
- Cadastro com código válido → entra como pendente.
- Admin aprova → usuário ganha acesso.
- Mapa “perto de mim” mostra membros e abre perfis.
- Busca + filtros retornam membros.
- Enviar DM para não-relacionado → cai em Solicitações.
- Aceitar solicitação → vira conversa normal.
- Follow recíproco → DM direto.
- Fluxos funcionando no mobile.

