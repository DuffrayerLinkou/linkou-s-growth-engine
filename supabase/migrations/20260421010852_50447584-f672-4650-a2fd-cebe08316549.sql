-- ============================================================
-- SPRINT 1: Memória Operacional do Linkouzinho
-- ============================================================

-- 1) client_goals
CREATE TABLE public.client_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  target_metric text,
  target_value numeric,
  deadline date,
  priority text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'active',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_client_goals_client ON public.client_goals(client_id, status);

-- 2) client_offers
CREATE TABLE public.client_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price numeric,
  target_audience text,
  differentiators jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'active',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_client_offers_client ON public.client_offers(client_id, status);

-- 3) client_channels
CREATE TABLE public.client_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  channel text NOT NULL,
  account_id text,
  status text NOT NULL DEFAULT 'active',
  monthly_budget numeric,
  notes text,
  last_activity_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_client_channels_client ON public.client_channels(client_id, status);

-- 4) client_constraints
CREATE TABLE public.client_constraints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'general',
  description text NOT NULL,
  severity text NOT NULL DEFAULT 'medium',
  active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_client_constraints_client ON public.client_constraints(client_id, active);

-- 5) client_decisions
CREATE TABLE public.client_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  title text NOT NULL,
  decision text NOT NULL,
  rationale text,
  decided_by uuid,
  decided_at timestamptz NOT NULL DEFAULT now(),
  related_entity_type text,
  related_entity_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_client_decisions_client ON public.client_decisions(client_id, decided_at DESC);

-- 6) client_actions
CREATE TABLE public.client_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  executed_by uuid,
  executed_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'success',
  error_message text,
  triggered_by_conversation_id uuid REFERENCES public.assistant_conversations(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_client_actions_client ON public.client_actions(client_id, executed_at DESC);

-- 7) insights
CREATE TABLE public.insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL,
  category text NOT NULL DEFAULT 'audit',
  evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
  generated_by text NOT NULL DEFAULT 'bot',
  status text NOT NULL DEFAULT 'new',
  urgency text NOT NULL DEFAULT 'medium',
  acknowledged_by uuid,
  acknowledged_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_insights_client ON public.insights(client_id, status, created_at DESC);

-- ============================================================
-- TRIGGERS updated_at
-- ============================================================
CREATE TRIGGER update_client_goals_updated_at BEFORE UPDATE ON public.client_goals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_client_offers_updated_at BEFORE UPDATE ON public.client_offers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_client_channels_updated_at BEFORE UPDATE ON public.client_channels FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_client_constraints_updated_at BEFORE UPDATE ON public.client_constraints FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_insights_updated_at BEFORE UPDATE ON public.insights FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE public.client_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_constraints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insights ENABLE ROW LEVEL SECURITY;

-- Macro: admin/account_manager FULL; client users SELECT only
-- client_goals
CREATE POLICY "Admins manage client_goals" ON public.client_goals FOR ALL USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Account managers manage client_goals" ON public.client_goals FOR ALL USING (has_role(auth.uid(),'account_manager'::app_role)) WITH CHECK (has_role(auth.uid(),'account_manager'::app_role));
CREATE POLICY "Client users view own client_goals" ON public.client_goals FOR SELECT USING (client_id = get_user_client_id(auth.uid()));

-- client_offers
CREATE POLICY "Admins manage client_offers" ON public.client_offers FOR ALL USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Account managers manage client_offers" ON public.client_offers FOR ALL USING (has_role(auth.uid(),'account_manager'::app_role)) WITH CHECK (has_role(auth.uid(),'account_manager'::app_role));
CREATE POLICY "Client users view own client_offers" ON public.client_offers FOR SELECT USING (client_id = get_user_client_id(auth.uid()));

-- client_channels
CREATE POLICY "Admins manage client_channels" ON public.client_channels FOR ALL USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Account managers manage client_channels" ON public.client_channels FOR ALL USING (has_role(auth.uid(),'account_manager'::app_role)) WITH CHECK (has_role(auth.uid(),'account_manager'::app_role));
CREATE POLICY "Client users view own client_channels" ON public.client_channels FOR SELECT USING (client_id = get_user_client_id(auth.uid()));

-- client_constraints
CREATE POLICY "Admins manage client_constraints" ON public.client_constraints FOR ALL USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Account managers manage client_constraints" ON public.client_constraints FOR ALL USING (has_role(auth.uid(),'account_manager'::app_role)) WITH CHECK (has_role(auth.uid(),'account_manager'::app_role));
CREATE POLICY "Client users view own client_constraints" ON public.client_constraints FOR SELECT USING (client_id = get_user_client_id(auth.uid()));

-- client_decisions
CREATE POLICY "Admins manage client_decisions" ON public.client_decisions FOR ALL USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Account managers manage client_decisions" ON public.client_decisions FOR ALL USING (has_role(auth.uid(),'account_manager'::app_role)) WITH CHECK (has_role(auth.uid(),'account_manager'::app_role));
CREATE POLICY "Client users view own client_decisions" ON public.client_decisions FOR SELECT USING (client_id = get_user_client_id(auth.uid()));

-- client_actions
CREATE POLICY "Admins manage client_actions" ON public.client_actions FOR ALL USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Account managers manage client_actions" ON public.client_actions FOR ALL USING (has_role(auth.uid(),'account_manager'::app_role)) WITH CHECK (has_role(auth.uid(),'account_manager'::app_role));
CREATE POLICY "Client users view own client_actions" ON public.client_actions FOR SELECT USING (client_id = get_user_client_id(auth.uid()));

-- insights
CREATE POLICY "Admins manage insights" ON public.insights FOR ALL USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Account managers manage insights" ON public.insights FOR ALL USING (has_role(auth.uid(),'account_manager'::app_role)) WITH CHECK (has_role(auth.uid(),'account_manager'::app_role));
CREATE POLICY "Client users view own insights" ON public.insights FOR SELECT USING (client_id = get_user_client_id(auth.uid()));

-- ============================================================
-- ESTADO DA CONVERSA (assistant_conversations)
-- ============================================================
ALTER TABLE public.assistant_conversations
  ADD COLUMN IF NOT EXISTS current_client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS current_topic text,
  ADD COLUMN IF NOT EXISTS current_objective text,
  ADD COLUMN IF NOT EXISTS last_recommendation jsonb,
  ADD COLUMN IF NOT EXISTS last_action jsonb,
  ADD COLUMN IF NOT EXISTS pending_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS state_updated_at timestamptz NOT NULL DEFAULT now();