

## Varredura de usabilidade — foco mobile

Fiz uma varredura nas páginas e componentes mais usados do painel admin. Abaixo estão **os problemas reais encontrados**, agrupados por gravidade, e o plano de correção.

---

### 1. Problemas críticos em mobile (quebram a experiência)

**a) Filtros do Kanban de Criativos não funcionam em mobile**
`src/pages/admin/Criativos.tsx` — os 2 `Select` de cliente e status estão com largura fixa `w-48` (192px) lado a lado. Em telas <400px estouram a linha sem grid responsivo, e o de "Cliente" trunca o nome.
**Fix:** trocar para `w-full sm:w-48` e empilhar com `grid grid-cols-1 sm:grid-cols-2 lg:flex` igual ao padrão do Projects.

**b) Kanban de Criativos vira coluna única em mobile e fica gigante**
`CreativeDemandKanban.tsx` usa `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6`. Em mobile vira **6 colunas empilhadas verticais** ocupando a tela inteira — você precisa rolar uma eternidade para ver outro status.
**Fix:** adotar o mesmo padrão dos Kanbans de Tarefas e Leads: `flex overflow-x-auto` com colunas de largura fixa (220-260px) para deslizar lateralmente. É o padrão já validado no projeto.

**c) Header do detalhe da demanda quebra em mobile**
`CreativeDemandDetail.tsx` linha 112-129 — o `Select` de status (`w-48`) + botão `⋯` + título longo competem no mesmo flex sem ordem responsiva. Em mobile o status "atropela" o título.
**Fix:** stack vertical em mobile (`flex-col sm:flex-row`), Select com `w-full sm:w-48`.

**d) Botão "Voltar para o quadro" sem padding seguro**
`CreativeDemandDetail.tsx` — em iPhone notch o botão fica colado na borda porque o `AdminLayout` usa `p-3 sm:p-4` mas o detalhe é `max-w-5xl mx-auto` sem padding extra de top em mobile.
**Fix:** garantir `pt-2` e `safe-area-inset` no container.

---

### 2. Problemas médios (irritantes mas usáveis)

**e) Filtros da página Projetos**
`src/pages/admin/Projects.tsx` linha 364-404 — em mobile o toggle "Período ativo" com `h-10 px-3 border` fica solto fora do grid de Selects. O Search ocupa 100%, depois 2 selects empilhados, depois um quadradinho do switch sozinho.
**Fix:** envelopar tudo num `grid grid-cols-2 sm:grid-cols-2 lg:flex` e o switch ocupar uma linha cheia em mobile.

**f) Cards de demanda no Kanban — botão `⋯` muito pequeno**
`CreativeDemandKanban.tsx` — o `CreativeDemandActions` fica num canto com botão de tamanho default, sobre uma área já clicável. Em mobile dá conflito de toque (o usuário abre a demanda em vez do menu).
**Fix:** aumentar área de toque (`h-8 w-8`), `e.stopPropagation()` reforçado, e em mobile mover para o canto inferior do card.

**g) Lista (modo "Lista") trunca informação em mobile**
`Criativos.tsx` linha 144-166 — badge de status + botão de ações + título competem na mesma linha. Em <400px o título some atrás do badge.
**Fix:** stack vertical em mobile (badge + ações abaixo do título).

**h) Modais (Dialog) sem fallback mobile no Criativos**
`CreativeDemandFormDialog.tsx` usa `max-w-2xl max-h-[90vh] overflow-y-auto` mas **não tem `max-w-[95vw]`**. Em iPhone SE/Galaxy pequeno fica colado nas bordas. O Templates já faz isso certo (`max-w-[95vw] sm:max-w-md`).
**Fix:** padrão `max-w-[95vw] sm:max-w-2xl` em todos os Dialogs do módulo (Criativos, novo entregável).

**i) Grids 2 colunas dentro do Dialog em mobile**
`CreativeDemandFormDialog.tsx` linhas 126/146 — `grid-cols-2` força Plataforma+Formato e Prazo+Prioridade lado a lado mesmo em 320px, espremendo os Selects.
**Fix:** `grid-cols-1 sm:grid-cols-2`.

---

### 3. Problemas menores (polimento)

**j)** Header do AdminCriativos: título "Demandas Criativas" com `text-2xl` + ícone + botão "Nova demanda" dão wrap estranho em 360px. Reduzir para `text-xl sm:text-2xl`.

**k)** Editor de entregáveis (`CreativeDeliverableEditor.tsx`) — botões "Salvar versão / Upload / Enviar para aprovação" em mobile ficam ok porque é `flex-wrap`, mas o badge de status + dropdown ⋯ no header podem encavalar com título longo. Garantir `truncate` no título.

**l)** Tabela de Clientes (`Clients.tsx`) já tem `hidden md:table-cell` — bom. Mas a coluna nome+ícone 40x40 em mobile come muito espaço; reduzir ícone para 32x32 em <sm.

**m)** Sidebar mobile: ao abrir um link e fechar o menu, a animação às vezes engasga em conexões lentas porque `LazyMotion` re-mounta. Sem fix urgente — só monitorar.

---

### Padrão visual que vou aplicar (consistência)

```text
Filtros responsivos:
┌───────────────────────────┐  mobile (1 col, search full)
│ [🔍 Buscar...............] │
│ [Cliente ▾] [Status ▾]    │  2 col
│ [✓ Período ativo        ] │  full
└───────────────────────────┘
                                desktop: tudo em flex-row

Kanban mobile:
horizontal scroll (swipe lateral) — NUNCA empilhado
colunas de 240px fixas
```

---

### Arquivos que vão ser tocados

- `src/pages/admin/Criativos.tsx` (filtros + lista mobile + título)
- `src/components/admin/criativos/CreativeDemandKanban.tsx` (scroll horizontal + cards mobile)
- `src/components/admin/criativos/CreativeDemandDetail.tsx` (header responsivo + safe area)
- `src/components/admin/criativos/CreativeDemandFormDialog.tsx` (largura mobile + grid)
- `src/components/admin/criativos/CreativeDemandActions.tsx` (área de toque)
- `src/components/admin/criativos/CreativeDeliverableEditor.tsx` (truncate no header)
- `src/pages/admin/Projects.tsx` (linha de filtros)

### Fora do escopo (não vou mexer agora)

- Banco / RLS / queries
- Lógica de negócio dos Kanbans (drag & drop, status flow)
- Sidebar e layout principal (já está mobile-friendly)
- Páginas que já seguem o padrão (Tarefas, Leads, Templates)

### Resultado esperado

- Kanban de Criativos navegável em qualquer celular (swipe lateral)
- Filtros nunca quebram nem truncam em telas pequenas
- Diálogos respeitam 95% da viewport em mobile
- Toques precisos no `⋯` sem abrir o card por engano
- Visual consistente com Tarefas/Leads/Projetos

