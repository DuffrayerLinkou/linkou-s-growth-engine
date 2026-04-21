

## Repaginar a sessão "Projetos" — sair do CRUD genérico

A página `/admin/projects` hoje é uma tabela CRUD pura (nome, status, datas, budget). "Plano" e "Campanhas" foram repaginados como visões ricas e contextuais da agência — "Projetos" precisa do mesmo tratamento.

### Conceito novo

Um projeto na Linkou é uma **onda de execução** dentro do plano estratégico do cliente: tem hipótese, entregas, métricas de impacto, e gera **aprendizados** (já existe a tabela `learnings`). Vamos parar de exibir o projeto como linha de tabela e passar a exibi-lo como **card de execução** com tudo conectado em um único drill-down.

### O que muda em `/admin/projects`

**1. Header com KPIs reais (não cards de status secos)**
- Projetos ativos · Budget total alocado · Entregas em andamento · Aprendizados registrados (últimos 30d)

**2. Substituir tabela por grade de cards de projeto**
Cada card mostra:
- Nome + cliente + badge de status
- Barra de progresso por **% de tarefas concluídas** (consulta `tasks` por `project_id`)
- Mini-stats: nº de campanhas vinculadas, nº de entregas criativas, nº de aprendizados
- Período + budget formatado
- Faixa lateral colorida pelo status

**3. Filtros contextuais**
- Busca + filtro de status (mantém)
- Adicionar filtro por **cliente** e por **período ativo**
- Adicionar toggle "Apenas com aprendizados pendentes"

**4. Drill-down rico (substitui o dialog "Visualizar" atual)**
Abrir um projeto leva a um dialog grande (max-w-4xl) com abas:

- **Visão geral**: cliente, descrição, período, budget, status, progresso de tarefas, contagens (campanhas/criativos/arquivos/aprendizados), data de criação
- **Tarefas vinculadas**: lista das tasks deste `project_id` com status colorido e responsável
- **Campanhas vinculadas**: cards compactos das campaigns deste `project_id` com plataforma, status, budget
- **Aprendizados**: lista da tabela `learnings` deste projeto (título, impacto, categoria, tags, aprovado por ponto focal). Mostrar empty state convidando a registrar.
- **Arquivos**: arquivos em `files` com `project_id`, com link de download

**5. Form de criação/edição**
- Manter campos atuais
- Adicionar campo **hipótese / objetivo** (usa `description` mas com label e placeholder orientados: "Qual hipótese este projeto valida? Qual resultado esperado?")

### Estrutura técnica

**Arquivos novos**
```text
src/components/admin/projects/ProjectCard.tsx          → card visual de projeto na grade
src/components/admin/projects/ProjectDetailDialog.tsx  → dialog com 4 abas
src/components/admin/projects/ProjectTasksTab.tsx
src/components/admin/projects/ProjectCampaignsTab.tsx
src/components/admin/projects/ProjectLearningsTab.tsx
src/components/admin/projects/ProjectFilesTab.tsx
```

**Arquivo editado**
- `src/pages/admin/Projects.tsx` — substituir tabela por grade de cards + KPIs no topo + filtros. Manter dialog de form atual (apenas reabilitando descrição com label "Hipótese / Objetivo"). Trocar dialog "Visualizar" pelo novo `ProjectDetailDialog`.

**Dados (já existem, sem migração)**
- `projects` — base
- `tasks.project_id` — para progresso e aba tarefas
- `campaigns.project_id` — para aba campanhas
- `learnings.project_id` — para aba aprendizados (tabela já existe e é rica: title, description, impact, category, tags, approved_by_ponto_focal)
- `files.project_id` — para aba arquivos

Cada aba do detalhe faz seu próprio fetch lazy ao abrir, evitando carregar tudo de uma vez na listagem.

**Componentes UI reaproveitados**
- `Card`, `Badge`, `Progress`, `Tabs`, `Dialog`, `Button` (todos já existem)
- Status colors já vêm de `status-config.ts` (`projectStatusLabels` / `projectStatusColors`)

### Fora do escopo (ficam para depois se quiser)
- Criar/editar aprendizados pelo dialog (por enquanto só leitura, igual fizemos com Plano)
- Linkouzinho com tools de projeto
- Tab "Projetos" dentro de `ClientDetail` (a página global cobre o caso)

