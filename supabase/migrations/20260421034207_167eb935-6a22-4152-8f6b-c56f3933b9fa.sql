-- Demandas criativas (a unidade de pedido)
CREATE TABLE public.creative_demands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  briefing TEXT,
  objective TEXT,
  platform TEXT,
  format TEXT,
  deadline DATE,
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'briefing',
  requested_by UUID,
  assigned_to UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_creative_demands_client ON public.creative_demands(client_id);
CREATE INDEX idx_creative_demands_status ON public.creative_demands(status);
CREATE INDEX idx_creative_demands_deadline ON public.creative_demands(deadline);

ALTER TABLE public.creative_demands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage creative_demands"
  ON public.creative_demands FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Account managers manage creative_demands"
  ON public.creative_demands FOR ALL
  USING (public.has_role(auth.uid(), 'account_manager'))
  WITH CHECK (public.has_role(auth.uid(), 'account_manager'));

CREATE POLICY "Client users view own creative_demands"
  ON public.creative_demands FOR SELECT
  USING (client_id = public.get_user_client_id(auth.uid()));

CREATE POLICY "Client users create own creative_demands"
  ON public.creative_demands FOR INSERT
  WITH CHECK (
    client_id = public.get_user_client_id(auth.uid())
    AND requested_by = auth.uid()
    AND status = 'briefing'
  );

CREATE POLICY "Client users update own briefing demands"
  ON public.creative_demands FOR UPDATE
  USING (
    client_id = public.get_user_client_id(auth.uid())
    AND requested_by = auth.uid()
    AND status = 'briefing'
  );

-- Entregáveis vinculados a uma demanda
CREATE TABLE public.creative_deliverables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  demand_id UUID NOT NULL REFERENCES public.creative_demands(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  current_version INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'in_production',
  approved_by_ponto_focal BOOLEAN NOT NULL DEFAULT false,
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID,
  feedback TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_creative_deliverables_demand ON public.creative_deliverables(demand_id);
CREATE INDEX idx_creative_deliverables_client ON public.creative_deliverables(client_id);
CREATE INDEX idx_creative_deliverables_status ON public.creative_deliverables(status);

ALTER TABLE public.creative_deliverables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage creative_deliverables"
  ON public.creative_deliverables FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Account managers manage creative_deliverables"
  ON public.creative_deliverables FOR ALL
  USING (public.has_role(auth.uid(), 'account_manager'))
  WITH CHECK (public.has_role(auth.uid(), 'account_manager'));

CREATE POLICY "Client users view own creative_deliverables"
  ON public.creative_deliverables FOR SELECT
  USING (client_id = public.get_user_client_id(auth.uid()));

CREATE POLICY "Ponto focal approves creative_deliverables"
  ON public.creative_deliverables FOR UPDATE
  USING (public.is_ponto_focal(auth.uid(), client_id))
  WITH CHECK (public.is_ponto_focal(auth.uid(), client_id));

-- Histórico de versões dos entregáveis
CREATE TABLE public.creative_deliverable_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deliverable_id UUID NOT NULL REFERENCES public.creative_deliverables(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  content TEXT,
  file_url TEXT,
  file_path TEXT,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (deliverable_id, version_number)
);

CREATE INDEX idx_creative_versions_deliverable ON public.creative_deliverable_versions(deliverable_id);
CREATE INDEX idx_creative_versions_client ON public.creative_deliverable_versions(client_id);

ALTER TABLE public.creative_deliverable_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage creative_deliverable_versions"
  ON public.creative_deliverable_versions FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Account managers manage creative_deliverable_versions"
  ON public.creative_deliverable_versions FOR ALL
  USING (public.has_role(auth.uid(), 'account_manager'))
  WITH CHECK (public.has_role(auth.uid(), 'account_manager'));

CREATE POLICY "Client users view own creative_deliverable_versions"
  ON public.creative_deliverable_versions FOR SELECT
  USING (client_id = public.get_user_client_id(auth.uid()));

-- Triggers de updated_at
CREATE TRIGGER update_creative_demands_updated_at
  BEFORE UPDATE ON public.creative_demands
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_creative_deliverables_updated_at
  BEFORE UPDATE ON public.creative_deliverables
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();