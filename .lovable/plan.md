
Objetivo
- Trocar o texto “FRATERNIDADE” que aparece no topo da sidebar (barra lateral) por “MEMBRO”, mantendo exatamente o mesmo estilo (fonte, tamanho, espaçamento/letter-spacing e efeito dourado que segue o mouse).
- Não alterar o texto da barra superior (header), conforme você confirmou.

O que vou mudar (bem direto)
1) Sidebar (src/components/AppSidebar.tsx)
- Local: dentro de `<SidebarGroupLabel>`, onde hoje está:
  - `<GoldHoverText className="text-[10px] font-semibold tracking-[0.35em]">FRATERNIDADE</GoldHoverText>`
- Ação: substituir apenas o conteúdo do texto para:
  - `MEMBRO`
- Manter:
  - o mesmo `GoldHoverText`
  - a mesma `className="text-[10px] font-semibold tracking-[0.35em]"`
  - a mesma lógica `!collapsed` (ou seja: o texto continua aparecendo apenas quando a sidebar estiver expandida)

2) Verificação rápida no Preview (critério de aceitação)
- Ao abrir o app, no topo da sidebar deve aparecer “MEMBRO” com o mesmo visual dourado premium.
- Ao passar o mouse por cima, o brilho/gradiente deve continuar funcionando igual.
- Colapsar/expandir a sidebar:
  - expandida: aparece “MEMBRO”
  - colapsada: o texto permanece oculto (como já está hoje)

Escopo (garantias)
- Não vou mexer na barra superior (header) nem em rotas/páginas.
- Só muda o texto “FRATERNIDADE” da sidebar para “MEMBRO”.

Notas técnicas (para manter qualidade)
- Nenhuma dependência nova.
- Mudança pontual de string (sem impacto em layout além da palavra em si; “MEMBRO” é mais curto, então tende a ficar ainda mais “limpo”).
