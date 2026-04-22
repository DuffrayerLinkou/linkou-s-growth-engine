

## Refino de UX & Mobile — Painel Admin (sprints temáticos)

3 sprints médios. Cada sprint tem **fase de auditoria** (eu navego, mapeio, te apresento o diagnóstico) + **fase de execução** (correções aprovadas). Você valida entre sprints.

---

### Sprint 1 — Navegação, Sidebar e Estrutura (mobile-first)

**Objetivo:** sidebar do admin tem 25+ itens em 5 grupos. No mobile vira um menu rolável gigante; no desktop ocupa 256px fixos. Vamos enxugar e modernizar.

**Auditoria:**
- Mapear todos os pontos de atrito de navegação no `AdminLayout` (mobile 375px, tablet 768px, desktop 1349px)
- Listar páginas admin que quebram horizontalmente (Keywords, Tarefas, Leads, WhatsApp, Métricas, Criativos têm tabelas/kanbans largos)
- Verificar comportamento dos grupos colapsáveis — hoje todos abrem por padrão, gerando scroll grande
- Checar se header mobile e bottom-nav fariam mais sentido para as rotas mais usadas

**Execução:**
- Migrar `AdminLayout` para `SidebarProvider` do shadcn com `collapsible="icon"` no desktop (mini-rail de 56px com tooltips)
- Lembrar estado aberto/fechado dos grupos por usuário (localStorage)
- Adicionar busca rápida no topo da sidebar (filtra itens em tempo real)
- Mobile: drawer com swipe-to-close, persistir grupo ativo expandido automaticamente
- Indicador visual claro de rota ativa também no grupo pai (hoje só destaca o item)
- Padronizar `SidebarTrigger` sempre visível no header mobile + adicionar atalho `⌘K` para command palette no desktop

---

### Sprint 2 — Tabelas, Dialogs e Densidade de dados (mobile)

**Objetivo:** páginas com tabelas largas (Keywords, Leads, Tarefas, Clientes, Métricas) só rolam horizontalmente no mobile — experiência ruim. Dialogs gigantes (ProjectDetail, KeywordDetail, LeadDetail) também não cabem.

**Auditoria:**
- Listar todas as tabelas admin e identificar as 3-5 colunas críticas (resto vira detalhe expandível)
- Mapear todos os dialogs >700px de largura que viram `Sheet` no mobile
- Verificar formulários longos (KeywordForm, ProjectForm, CampaignForm) — hoje quebram no mobile
- Identificar onde sparklines/badges/ações ficam ilegíveis em telas <400px

**Execução:**
- Criar componente `ResponsiveTable` que vira **lista de cards** em <768px (term + KPIs principais + ação primária; resto em "expandir")
- Aplicar em: `KeywordTable`, `LeadsKanban` (vira lista vertical), `TasksKanban`, tabela de Clientes, tabela de Métricas
- Converter dialogs grandes para `Sheet` lateral no mobile (`useIsMobile`): KeywordDetail, ProjectDetail, LeadDetail, CreativeDemandDetail
- Formulários: dividir em steps verticais no mobile, manter grid no desktop
- Adicionar barra de filtros sticky no topo das listagens (some no scroll para baixo, volta no scroll para cima)
- Padronizar empty states e loading skeletons (hoje cada página tem um diferente)

---

### Sprint 3 — Linkouzinho, Toques finais e Microinterações

**Objetivo:** o widget do Linkouzinho hoje é fixo em 380×520px e atropela o conteúdo no mobile. Botões pequenos, contraste, feedback de ações e fluxos com cliques desnecessários.

**Auditoria:**
- Testar Linkouzinho em 360px de largura (hoje `max-w-[calc(100vw-2rem)]` mas altura 520px ocupa quase toda a tela)
- Mapear toasts, confirmações e estados de loading inconsistentes entre páginas
- Identificar botões com toque <44px (Apple HIG mínimo) — sparklines, ícones de ação em tabelas
- Verificar fluxos com cliques redundantes (ex: criar tarefa abre dialog → seleciona cliente → seleciona projeto)
- Listar onde falta breadcrumb / botão voltar contextual

**Execução:**
- Linkouzinho mobile: vira **bottom sheet** full-width que sobe da base, com handle de arraste; desktop mantém o card flutuante atual
- Padronizar todos os botões de ação para mínimo `h-10 w-10` no mobile (44px)
- Padronizar feedback: toast verde para sucesso, sonner para erros com retry, skeleton para loading (não spinners)
- Adicionar `Breadcrumb` contextual nas páginas profundas (ClientDetail, ProjectDetail, etc)
- Smart defaults nos formulários: cliente já vem pré-selecionado vindo da tela do cliente; projeto da campanha; etc
- Polish de microinterações: hover states, transições de 200ms, foco visível em todos os interativos
- Pequenos ajustes de espaçamento e tipografia para densidade de informação consistente

---

### Detalhes técnicos

| Sprint | Arquivos principais |
|---|---|
| 1 | `src/layouts/AdminLayout.tsx`, novo `src/components/admin/AdminSidebar.tsx`, novo `src/components/CommandPalette.tsx` |
| 2 | novo `src/components/ui/responsive-table.tsx`, `KeywordTable`, `LeadsKanban`, `TasksKanban`, todos os `*DetailDialog.tsx` viram `Sheet` no mobile via `useIsMobile` |
| 3 | `LinkouzinhoInternal.tsx` (bottom sheet mobile), novo `src/components/Breadcrumbs.tsx`, padronização global |

**Hook utilitário já existente:** `useIsMobile()` em `src/hooks/use-mobile.tsx` — base para tudo.

**Sem mudanças de banco** em nenhum dos 3 sprints.

### Fluxo de trabalho proposto

1. Você aprova este plano geral
2. Começo o **Sprint 1 fase auditoria** → te apresento diagnóstico com prints/lista de pontos
3. Você inclui **seus pontos misto** que mencionou
4. Aprovamos correções → executo
5. Validação no preview → próximo sprint

### Fora de escopo (próximos refinos)

- Painel cliente mobile (sprint separado quando os 3 estiverem fechados)
- Landing page (já passou por modernização recente)
- Acessibilidade WCAG completa e Lighthouse perf (pode virar Sprint 4 se quiser)
- Testes automatizados (Playwright / Vitest)

