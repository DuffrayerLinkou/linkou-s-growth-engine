

## Auditoria de performance e otimização geral

### Diagnóstico (o que está pesando)

Após auditar Campanhas, Projetos, Dashboard e camada compartilhada (Auth, Layout, NotificationBell), identifiquei 6 causas que se somam para a lentidão atual:

1. **`SELECT *` em listas grandes** — `Admin → Campanhas` traz **todos os 30+ campos** de cada campanha (incluindo `strategy`, `ad_copy`, `targeting`, `metrics`, `placements`) só para renderizar uma tabela com 6 colunas.
2. **Queries não filtradas no Admin Projetos** — busca **todas as `tasks`, `campaigns`, `learnings`, `creative_demands` do banco** para calcular contadores no card. À medida que os dados crescem, cada abertura da tela puxa mais e mais linhas (e bate no limite de 1000 do Supabase, escondendo dados).
3. **Sem cache (React Query)** em Admin Campanhas, Admin Projetos, Cliente Projetos, Cliente Campanhas — cada navegação refaz **todas** as queries do zero, mesmo que o usuário tenha entrado na tela há 10 segundos.
4. **Dashboard admin com ~20 queries paralelas independentes** — cada KPI dispara um `count(*)` separado. Com filtro de período ativo, são ~15 round-trips simultâneos que travam o backend nos primeiros segundos.
5. **Sem paginação** em Campanhas, Projetos, Tarefas, Leads, Criativos — quando passar de 1000 registros, queries começam a truncar silenciosamente.
6. **Animações em cascata** (`delay: index * 0.04` no `ProjectCard`/cards) adicionam até 1-2 s de latência percebida com muitos cards, mesmo com dados já carregados.

Sintomas extras menores: `NotificationBell` tem `refetchInterval: 60s` + realtime que invalida o cache em cada INSERT (duplica fetch); `console` mostra warning de `forwardRef` faltando no `PWAInstallPrompt` (não é gargalo, mas é ruído).

---

### O que vamos fazer

**Sem mudar nenhuma funcionalidade nem visual.** Apenas otimizações invisíveis ao usuário.

#### 1. Otimizar queries de listas (impacto alto)

- **Admin Campanhas**: trocar `select("*")` por uma lista enxuta (`id, name, status, platform, budget, start_date, end_date, approved_by_ponto_focal, client_id, project_id, clients(id,name), projects:project_id(id,name)`). Carregar campos pesados (`strategy`, `ad_copy`, `targeting`, `metrics`, `results`) **apenas quando o admin abrir Editar/Detalhe** da campanha (lazy fetch by id).
- **Admin Projetos**: substituir as 4 queries soltas (`tasks`, `campaigns`, `learnings`, `creative_demands`) por **uma RPC `get_project_stats()`** no Supabase que devolve `project_id, tasks_total, tasks_done, campaigns_count, deliverables_count, learnings_count` já agregados via SQL. Reduz de ~4-6 round-trips + processamento client-side para 1 round-trip pré-agregado.
- **Cliente Projetos**: mesma RPC, com parâmetro `client_id`.
- Adicionar `LIMIT 100` + ordenação por `created_at desc` em todas as listas longas; adicionar paginação básica ("Carregar mais") quando passar do limite.

#### 2. Adotar React Query nas telas que ainda usam `useState/useEffect`

Migrar Admin Campanhas, Admin Projetos, Cliente Projetos, Cliente Campanhas e Cliente Tarefas para `useQuery`, aproveitando o `staleTime: 5min` já configurado em `App.tsx`. Resultado: navegar entre telas vira instantâneo enquanto o cache está fresco, e refetch acontece em background.

#### 3. Reduzir queries do Dashboard admin

Consolidar os ~12 `count(*)` independentes em **2-3 RPCs agregadoras** (`get_dashboard_kpis(date_from, date_to)` e `get_dashboard_alerts()`). Mantém o mesmo visual e os mesmos números — só reduz a tempestade de chamadas.

#### 4. Aliviar rendering

- Remover o `delay: index * 0.04` dos cards (Project, Lead, Demand) — manter o fade/slide, mas todos animam juntos.
- Memorizar listas filtradas com `useMemo` em Campanhas/Projetos (hoje refiltra a cada keystroke).

#### 5. Limpezas finais (baixo risco, alto polimento)

- `NotificationBell`: trocar o `invalidateQueries` do realtime por um `setQueryData` que faz `prepend` do INSERT recebido (sem refetch redundante). Manter o `refetchInterval` mas subir para 2 min.
- Corrigir o warning `Function components cannot be given refs` no `PWAInstallPrompt` adicionando `forwardRef`.
- Adicionar índices SQL nas colunas mais consultadas que ainda não têm: `tasks(client_id, project_id, status)`, `campaigns(client_id, project_id, status)`, `creative_demands(campaign_id)`, `learnings(project_id, client_id)`, `notifications(user_id, read, created_at desc)`.

---

### Como você vai sentir

- **Campanhas**: payload baixa de ~300-800 KB para ~30-80 KB. Tela carrega em <1 s mesmo com 200+ campanhas.
- **Projetos (admin e cliente)**: 6 queries → 2 queries. Tempo de abertura cai ~70%.
- **Dashboard**: 15+ chamadas → 3-4 chamadas. Spinner some bem mais rápido.
- **Navegação entre telas**: vira instantâneo dentro da janela de cache (5 min), porque tudo passa a viver em React Query.
- **Listas grandes**: param de truncar silenciosamente ao passar de 1000 itens.

Tudo invisível: nenhuma rota muda, nenhum botão muda, nenhuma permissão muda.

---

### Detalhes técnicos

**Migração SQL (idempotente)**:
```sql
-- RPC agregadora de projetos
CREATE OR REPLACE FUNCTION public.get_project_stats(_client_id uuid DEFAULT NULL)
RETURNS TABLE(project_id uuid, tasks_total int, tasks_done int,
              campaigns_count int, deliverables_count int, learnings_count int)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id,
    COALESCE((SELECT count(*)::int FROM tasks t WHERE t.project_id = p.id), 0),
    COALESCE((SELECT count(*)::int FROM tasks t WHERE t.project_id = p.id AND t.status='done'), 0),
    COALESCE((SELECT count(*)::int FROM campaigns c WHERE c.project_id = p.id), 0),
    COALESCE((SELECT count(DISTINCT cd.id)::int FROM creative_demands cd
              JOIN campaigns c ON c.id = cd.campaign_id WHERE c.project_id = p.id), 0),
    COALESCE((SELECT count(*)::int FROM learnings l WHERE l.project_id = p.id), 0)
  FROM projects p
  WHERE _client_id IS NULL OR p.client_id = _client_id;
$$;

-- Índices em falta
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_client_status ON tasks(client_id, status);
CREATE INDEX IF NOT EXISTS idx_campaigns_project ON campaigns(project_id);
CREATE INDEX IF NOT EXISTS idx_creative_demands_campaign ON creative_demands(campaign_id);
CREATE INDEX IF NOT EXISTS idx_learnings_project ON learnings(project_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read_date
  ON notifications(user_id, read, created_at DESC);

-- RPC dashboard (versão resumida)
CREATE OR REPLACE FUNCTION public.get_dashboard_kpis(_from timestamptz, _to timestamptz)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object(
    'leads_period', (SELECT count(*) FROM leads WHERE created_at BETWEEN _from AND _to),
    'leads_qualified', (SELECT count(*) FROM leads WHERE status='qualified' AND created_at BETWEEN _from AND _to),
    'clients_active', (SELECT count(*) FROM clients WHERE status='ativo'),
    'clients_operacao', (SELECT count(*) FROM clients WHERE phase='operacao_guiada'),
    'tasks_overdue', (SELECT count(*) FROM tasks WHERE due_date < CURRENT_DATE AND status <> 'completed'),
    'campaigns_active', (SELECT count(*) FROM campaigns WHERE status='running')
  );
$$;
```

**Arquivos editados** (resumo, sem mexer no visual):
- `src/pages/admin/Campaigns.tsx` — payload enxuto + lazy detail + React Query
- `src/pages/admin/Projects.tsx` — usar RPC, React Query
- `src/pages/cliente/Projetos.tsx` — usar RPC, React Query
- `src/pages/cliente/Campanhas.tsx`, `src/pages/cliente/Tarefas.tsx` — React Query
- `src/pages/admin/Dashboard.tsx` — consolidar em RPC
- `src/components/NotificationBell.tsx` — `setQueryData` no realtime, intervalo 120 s
- `src/components/admin/projects/ProjectCard.tsx` — remover delay incremental
- `src/components/PWAInstallPrompt.tsx` — `forwardRef` para silenciar warning

Sem alterações em RLS, rotas, layouts, UI, permissões ou regras de negócio.

