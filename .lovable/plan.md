
Objetivo (o que você pediu)
- No Perfil: em vez de o usuário digitar “Cidade/UF”, ele informa somente o CEP e o sistema preenche automaticamente cidade + estado.
- No Mapa (/mapa): assim que o CEP for salvo/validado, o usuário passa a aparecer como um pin no mapa (um pin por membro), com privacidade “centro + aleatório”, e o mapa permite zoom/pan no Brasil.
- Regras confirmadas por você:
  - Um pin por membro
  - Somente aprovados aparecem no mapa
  - CEP é obrigatório
  - Privacidade: centro da cidade + pequena variação aleatória

Diagnóstico do que existe hoje
- Perfil: `ProfileForm` salva `region` (texto livre “Cidade/UF”) e outros campos em `profiles`.
- Mapa: `/mapa` aponta para `src/pages/Index.tsx`, que hoje é só placeholder (um quadrado).
- Banco: `profiles` tem `region`, mas não tem CEP/cidade/estado nem coordenadas.
- Segurança atual: usuários só conseguem ver o próprio perfil; admins veem todos. Para o mapa funcionar sem abrir dados sensíveis, precisaremos de uma forma “segura” de expor somente pins (sem liberar SELECT geral na tabela profiles).

Abordagem proposta (simples, robusta e segura)
1) Guardar no backend, no perfil, a localização “base” (centro da cidade) a partir do CEP:
   - `postal_code` (CEP)
   - `city` (cidade)
   - `state` (UF)
   - `location_lat` / `location_lng` (coordenada base do centro aproximado)
2) Para privacidade, NÃO vamos entregar `location_lat/lng` direto ao app para outros membros.
   - O mapa vai consumir um RPC (“função do backend”) que:
     - só funciona para usuário autenticado
     - retorna apenas membros aprovados
     - aplica “jitter” (pequena aleatorização) determinística por `user_id` para que o pin fique estável e não revele o centro exato
     - retorna somente os campos necessários para desenhar pins
3) Converter CEP -> cidade/UF usando um serviço público (ViaCEP) e cidade/UF -> lat/lng usando geocoding (OpenStreetMap Nominatim), mas com cache para não depender de requisições repetidas.

Parte A — Mudanças no backend (estrutura de dados)
A1) Migração: adicionar colunas em `profiles`
- Novas colunas sugeridas:
  - `postal_code text` (CEP, obrigatório na UI; no banco pode ser nullable inicialmente para não quebrar perfis existentes)
  - `city text`
  - `state text`
  - `location_lat double precision`
  - `location_lng double precision`
  - `location_updated_at timestamptz`
- Observação: manter `region` por compatibilidade (podemos preenchê-la automaticamente como “Cidade/UF” por enquanto, para não quebrar nada que use `region` hoje).

A2) Tabela de cache de geocoding (para robustez e custo)
- Criar uma tabela `geo_city_cache` (nome pode variar) com:
  - `id uuid`
  - `key text unique` (ex.: “cidade|UF|BR” normalizado)
  - `city text`, `state text`
  - `lat double precision`, `lng double precision`
  - `source text` (ex.: “nominatim”)
  - `updated_at timestamptz`
- Isso reduz chamadas externas e melhora performance.

A3) Função segura para o mapa (RPC)
- Criar uma função do banco (security definer) por exemplo `get_approved_member_pins()`, retornando algo como:
  - `user_id uuid`
  - `city text`
  - `state text`
  - `lat double precision` (já com jitter aplicado)
  - `lng double precision` (já com jitter aplicado)
- Regras dentro da função:
  - Se não estiver autenticado: negar (ou retornar vazio)
  - Retornar somente `profiles.access_status = 'approved'`
  - Retornar somente perfis com `location_lat/lng` preenchidos
  - Aplicar jitter determinístico:
    - amplitude pequena (ex.: 0.005–0.02 graus, ajustável; ~0,5–2 km dependendo da latitude)
    - determinístico por user_id (ex.: usando hash do uuid), para o pin não “pular” a cada reload
  - Limite de segurança: `limit` (ex.: 5000) para evitar resposta gigante.
- Por que RPC? Porque hoje o RLS impede “ver outros perfis” (correto). O mapa precisa de um endpoint seguro que entregue somente o que é permitido.

Parte B — Backend functions (CEP + geocoding)
B1) Criar uma função backend “resolve-location-from-cep”
- Entrada: CEP (string)
- Validações:
  - manter só dígitos
  - exigir exatamente 8 dígitos
- Fluxo:
  1) Consultar ViaCEP e obter `localidade` (cidade) e `uf` (estado)
  2) Montar chave de cache (cidade+UF) e consultar `geo_city_cache`
  3) Se não existir cache, chamar Nominatim para geocodificar (cidade, UF, Brasil) e salvar no cache
  4) Atualizar o perfil do usuário autenticado em `profiles` com:
     - `postal_code`, `city`, `state`, `location_lat`, `location_lng`, `location_updated_at`
     - e também `region = city || '/' || state` (para manter compatibilidade)
  5) Retornar para o front o resultado (city, state) + um status (“ok”/“erro”)
- Motivo de fazer isso no backend:
  - Evita problemas de CORS / rate-limit do Nominatim no navegador
  - Centraliza validação
  - Permite cache
  - Evita expor detalhes de implementação no front

Parte C — Ajustes no Perfil (UI)
C1) Trocar “Região” por “CEP”
- No `ProfileForm`:
  - substituir o input `region` por um input `postal_code` (CEP)
  - UX: ao preencher e sair do campo (onBlur) ou clicar “Salvar”:
    - chamar `resolve-location-from-cep` para validar e preencher cidade/UF
  - mostrar cidade/UF como campos “somente leitura” (read-only) logo abaixo, para o usuário enxergar o que foi identificado
  - se der erro (CEP inválido/Não encontrado), mostrar mensagem clara e impedir salvar (já que “CEP obrigatório”)

C2) Legibilidade e comportamento
- Manter o formulário clean:
  - Campo “CEP” (obrigatório)
  - “Cidade” e “UF” exibidos automaticamente (read-only)
  - “Expertises” e “Bio” permanecem como estão

C3) Compatibilidade com perfil existente
- Para usuários antigos que já têm `region` mas não têm CEP:
  - ao entrar no Perfil, mostrar aviso “Para aparecer no mapa, complete seu CEP.”
  - não bloquear uso do app, mas como você quer CEP obrigatório, vamos bloquear o “Salvar perfil” sem CEP (a partir do momento que você aprovar essa mudança).

Parte D — Mapa (/mapa) com zoom e pins
D1) Biblioteca de mapa
- Implementar com Leaflet + React-Leaflet (leve, padrão no React, zoom/pan fácil).
- Importar CSS do Leaflet no app (necessário para o mapa renderizar direito).

D2) Nova versão do `src/pages/Index.tsx`
- Substituir o placeholder por:
  - um mapa do Brasil (tile do OpenStreetMap)
  - markers (pins) carregados via `supabase.rpc('get_approved_member_pins')`
  - comportamento:
    - zoom/pan livre
    - inicial: “fit bounds” no Brasil (ou zoom padrão com centro em Brasil)
    - opcional: se o usuário tiver cidade/UF e coords, centralizar próximo dele
- Sidebar (lado direito):
  - status “Você aparece no mapa” (somente se aprovado e com location preenchida)
  - contador de pins carregados
  - (próximo passo) filtro por UF/cidade, raio etc.

D3) Privacidade “centro + aleatório”
- O jitter será aplicado no backend na função RPC, não no front.
- Determinístico por membro (seed baseada no `user_id`) para não ficar mudando.
- Não retornaremos coordenadas “reais”/base.

Sequência de implementação (ordem segura)
1) Ler/ajustar schema atual e aplicar migração para colunas novas + tabela cache
2) Criar backend function `resolve-location-from-cep` (ViaCEP + Nominatim + cache + update do perfil)
3) Criar RPC `get_approved_member_pins` com jitter determinístico e controle de acesso
4) Ajustar `ProfileForm`:
   - Campo CEP obrigatório
   - Mostra cidade/UF preenchidos automaticamente
   - Salvar perfil inclui CEP/region (compatível)
5) Implementar o mapa em `/mapa`:
   - instalar Leaflet/React-Leaflet
   - renderizar pins da RPC
   - zoom/pan e base “Brasil”
6) Testes end-to-end

Testes que você deve conseguir fazer no final
- Perfil:
  - Digitar CEP válido -> preencher cidade/UF automaticamente -> salvar -> recarregar página -> manter.
  - CEP inválido -> mensagem clara -> não salva.
- Aprovação:
  - Usuário pendente não aparece no mapa.
  - Após aprovar no Admin, ele aparece no mapa.
- Mapa:
  - Abre `/mapa` -> mostra Brasil -> pins sempre visíveis -> zoom/pan funciona.
  - Pins não “pulam” a cada refresh (jitter determinístico).

Riscos/limites (para alinhar expectativa)
- Serviços públicos (ViaCEP/Nominatim) têm limites; por isso o cache é importante.
- “Cidade/UF” pode ter ambiguidades (ex.: cidades com mesmo nome em estados diferentes). Como vamos usar (cidade + UF), melhora muito.
- Para CEPs muito novos/áreas rurais, o ViaCEP pode retornar dados incompletos; trataremos com mensagem e fallback.

Checklist do que eu vou mexer (arquivos/áreas)
- Migrações do banco (novas colunas + tabela cache + RPC)
- Funções do backend (resolver CEP e geocoding)
- `src/components/profile/ProfileForm.tsx` (trocar Região por CEP + exibir cidade/UF auto)
- `src/pages/Index.tsx` (transformar em mapa real com pins)
- `package.json` (adicionar dependências do mapa)
- CSS do mapa (import Leaflet CSS em algum ponto global, ex.: `src/index.css` ou `src/main.tsx`)

Critérios de aceite (como “ficou do jeito que você pediu”)
- Usuário só digita CEP; cidade/UF aparecem automaticamente
- Salvar perfil já prepara o pin para o mapa
- Somente aprovados aparecem no mapa
- Um pin por membro
- Pins têm privacidade (centro + aleatório) e são estáveis
- Mapa do Brasil com zoom/pan funcionando

