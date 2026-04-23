-- =========================================================
-- RPC: get_project_stats - agrega contadores por projeto
-- =========================================================
CREATE OR REPLACE FUNCTION public.get_project_stats(_client_id uuid DEFAULT NULL)
RETURNS TABLE(
  project_id uuid,
  tasks_total integer,
  tasks_done integer,
  campaigns_count integer,
  deliverables_count integer,
  learnings_count integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id AS project_id,
    COALESCE((SELECT count(*)::int FROM public.tasks t WHERE t.project_id = p.id), 0) AS tasks_total,
    COALESCE((SELECT count(*)::int FROM public.tasks t WHERE t.project_id = p.id AND t.status = 'done'), 0) AS tasks_done,
    COALESCE((SELECT count(*)::int FROM public.campaigns c WHERE c.project_id = p.id), 0) AS campaigns_count,
    COALESCE((
      SELECT count(DISTINCT cd.id)::int
      FROM public.creative_demands cd
      JOIN public.campaigns c ON c.id = cd.campaign_id
      WHERE c.project_id = p.id
    ), 0) AS deliverables_count,
    COALESCE((SELECT count(*)::int FROM public.learnings l WHERE l.project_id = p.id), 0) AS learnings_count
  FROM public.projects p
  WHERE _client_id IS NULL OR p.client_id = _client_id;
$$;

-- =========================================================
-- RPC: get_dashboard_kpis - todos os contadores principais
-- =========================================================
CREATE OR REPLACE FUNCTION public.get_dashboard_kpis(_from timestamptz, _to timestamptz)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'leads_period', (SELECT count(*) FROM public.leads WHERE created_at >= _from AND created_at <= _to),
    'leads_qualified', (SELECT count(*) FROM public.leads WHERE status = 'qualified' AND created_at >= _from AND created_at <= _to),
    'clients_active', (SELECT count(*) FROM public.clients WHERE status = 'ativo'),
    'clients_operacao', (SELECT count(*) FROM public.clients WHERE phase = 'operacao_guiada'),
    'tasks_overdue', (SELECT count(*) FROM public.tasks WHERE due_date < CURRENT_DATE AND status <> 'completed'),
    'campaigns_active', (SELECT count(*) FROM public.campaigns WHERE status = 'running')
  );
$$;

-- =========================================================
-- Índices para acelerar as consultas mais frequentes
-- =========================================================
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_client_status ON public.tasks(client_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date_status ON public.tasks(due_date, status);
CREATE INDEX IF NOT EXISTS idx_campaigns_project_id ON public.campaigns(project_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_client_status ON public.campaigns(client_id, status);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON public.campaigns(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_creative_demands_campaign_id ON public.creative_demands(campaign_id);
CREATE INDEX IF NOT EXISTS idx_learnings_project_id ON public.learnings(project_id);
CREATE INDEX IF NOT EXISTS idx_learnings_client_id ON public.learnings(client_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read_date ON public.notifications(user_id, read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_status_created ON public.leads(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_client_created ON public.projects(client_id, created_at DESC);