-- Tabela de Contratos
CREATE TABLE public.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL,
  template_name TEXT,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'draft',
  sent_at TIMESTAMPTZ,
  sent_to_email TEXT,
  signed_at TIMESTAMPTZ,
  manager_name TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Briefings
CREATE TABLE public.briefings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL,
  title TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  content JSONB,
  nicho TEXT,
  publico_alvo TEXT,
  budget_mensal DECIMAL(12,2),
  objetivos TEXT,
  concorrentes TEXT,
  diferenciais TEXT,
  observacoes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Planos Estratégicos
CREATE TABLE public.strategic_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL,
  title TEXT NOT NULL,
  status TEXT DEFAULT 'draft',
  objectives JSONB,
  kpis JSONB,
  personas JSONB,
  funnel_strategy TEXT,
  campaign_types TEXT[],
  budget_allocation JSONB,
  timeline_start DATE,
  timeline_end DATE,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Pagamentos
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(12,2) NOT NULL,
  status TEXT DEFAULT 'pending',
  due_date DATE,
  paid_at TIMESTAMPTZ,
  payment_method TEXT,
  invoice_number TEXT,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.briefings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strategic_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para Contracts
CREATE POLICY "Admins can manage all contracts" ON public.contracts FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Account managers can manage all contracts" ON public.contracts FOR ALL USING (has_role(auth.uid(), 'account_manager'));
CREATE POLICY "Clients can view their contracts" ON public.contracts FOR SELECT USING (client_id = get_user_client_id(auth.uid()));

-- Políticas RLS para Briefings
CREATE POLICY "Admins can manage all briefings" ON public.briefings FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Account managers can manage all briefings" ON public.briefings FOR ALL USING (has_role(auth.uid(), 'account_manager'));
CREATE POLICY "Clients can view their briefings" ON public.briefings FOR SELECT USING (client_id = get_user_client_id(auth.uid()));

-- Políticas RLS para Strategic Plans
CREATE POLICY "Admins can manage all strategic plans" ON public.strategic_plans FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Account managers can manage all strategic plans" ON public.strategic_plans FOR ALL USING (has_role(auth.uid(), 'account_manager'));
CREATE POLICY "Clients can view their strategic plans" ON public.strategic_plans FOR SELECT USING (client_id = get_user_client_id(auth.uid()));

-- Políticas RLS para Payments
CREATE POLICY "Admins can manage all payments" ON public.payments FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Account managers can manage all payments" ON public.payments FOR ALL USING (has_role(auth.uid(), 'account_manager'));
CREATE POLICY "Clients can view their payments" ON public.payments FOR SELECT USING (client_id = get_user_client_id(auth.uid()));

-- Triggers para updated_at
CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON public.contracts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_briefings_updated_at BEFORE UPDATE ON public.briefings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_strategic_plans_updated_at BEFORE UPDATE ON public.strategic_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();