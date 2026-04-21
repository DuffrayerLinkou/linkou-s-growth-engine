-- Clusters/pillares de conteúdo
CREATE TABLE public.keyword_clusters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  name text NOT NULL,
  pillar_url text,
  intent text,
  description text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_keyword_clusters_client ON public.keyword_clusters(client_id);

ALTER TABLE public.keyword_clusters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage keyword_clusters"
  ON public.keyword_clusters FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Account managers manage keyword_clusters"
  ON public.keyword_clusters FOR ALL
  USING (has_role(auth.uid(), 'account_manager'::app_role))
  WITH CHECK (has_role(auth.uid(), 'account_manager'::app_role));

CREATE POLICY "Client users view own keyword_clusters"
  ON public.keyword_clusters FOR SELECT
  USING (client_id = get_user_client_id(auth.uid()));

CREATE TRIGGER trg_keyword_clusters_updated_at
  BEFORE UPDATE ON public.keyword_clusters
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Keywords
CREATE TABLE public.keywords (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  cluster_id uuid REFERENCES public.keyword_clusters(id) ON DELETE SET NULL,
  term text NOT NULL,
  intent text DEFAULT 'informational',
  search_volume integer,
  difficulty integer,
  cpc numeric,
  current_position integer,
  target_url text,
  status text NOT NULL DEFAULT 'target',
  tags text[] NOT NULL DEFAULT '{}',
  campaign_id uuid REFERENCES public.campaigns(id) ON DELETE SET NULL,
  task_id uuid,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_keywords_client ON public.keywords(client_id);
CREATE INDEX idx_keywords_cluster ON public.keywords(cluster_id);
CREATE INDEX idx_keywords_status ON public.keywords(status);

ALTER TABLE public.keywords ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage keywords"
  ON public.keywords FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Account managers manage keywords"
  ON public.keywords FOR ALL
  USING (has_role(auth.uid(), 'account_manager'::app_role))
  WITH CHECK (has_role(auth.uid(), 'account_manager'::app_role));

CREATE POLICY "Client users view own keywords"
  ON public.keywords FOR SELECT
  USING (client_id = get_user_client_id(auth.uid()));

CREATE TRIGGER trg_keywords_updated_at
  BEFORE UPDATE ON public.keywords
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Histórico de posição
CREATE TABLE public.keyword_rankings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword_id uuid NOT NULL REFERENCES public.keywords(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  position integer NOT NULL,
  checked_at timestamptz NOT NULL DEFAULT now(),
  source text NOT NULL DEFAULT 'manual',
  notes text
);

CREATE INDEX idx_keyword_rankings_keyword ON public.keyword_rankings(keyword_id, checked_at DESC);
CREATE INDEX idx_keyword_rankings_client ON public.keyword_rankings(client_id);

ALTER TABLE public.keyword_rankings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage keyword_rankings"
  ON public.keyword_rankings FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Account managers manage keyword_rankings"
  ON public.keyword_rankings FOR ALL
  USING (has_role(auth.uid(), 'account_manager'::app_role))
  WITH CHECK (has_role(auth.uid(), 'account_manager'::app_role));

CREATE POLICY "Client users view own keyword_rankings"
  ON public.keyword_rankings FOR SELECT
  USING (client_id = get_user_client_id(auth.uid()));