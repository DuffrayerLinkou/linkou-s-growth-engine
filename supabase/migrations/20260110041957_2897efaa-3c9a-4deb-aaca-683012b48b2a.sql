-- Criar tabela para armazenar métricas de tráfego pago
CREATE TABLE public.traffic_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  
  -- Métricas de Tráfego
  alcance DECIMAL(15,2),
  impressoes DECIMAL(15,2),
  frequencia DECIMAL(10,4),
  cliques INTEGER,
  custo_por_clique DECIMAL(10,4),
  
  -- Métricas de Conversão
  quantidade_leads INTEGER,
  quantidade_vendas INTEGER,
  custo_por_lead DECIMAL(10,4),
  custo_por_venda DECIMAL(10,4),
  investimento DECIMAL(15,2),
  
  -- Auditoria
  created_by UUID REFERENCES public.profiles(id),
  updated_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraint para evitar duplicatas
  UNIQUE(client_id, year, month)
);

-- Trigger de validação para mês (1-12)
CREATE OR REPLACE FUNCTION public.validate_traffic_metrics_month()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.month < 1 OR NEW.month > 12 THEN
    RAISE EXCEPTION 'Month must be between 1 and 12';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_traffic_metrics_month_trigger
  BEFORE INSERT OR UPDATE ON public.traffic_metrics
  FOR EACH ROW EXECUTE FUNCTION public.validate_traffic_metrics_month();

-- Habilitar RLS
ALTER TABLE public.traffic_metrics ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view traffic metrics of their client" 
  ON public.traffic_metrics FOR SELECT 
  USING (public.user_has_client_access(auth.uid(), client_id));

CREATE POLICY "Ponto focal can insert traffic metrics" 
  ON public.traffic_metrics FOR INSERT 
  WITH CHECK (
    public.is_ponto_focal(auth.uid(), client_id)
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'account_manager')
  );

CREATE POLICY "Ponto focal can update traffic metrics" 
  ON public.traffic_metrics FOR UPDATE 
  USING (
    public.is_ponto_focal(auth.uid(), client_id)
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'account_manager')
  );

CREATE POLICY "Admins can delete traffic metrics"
  ON public.traffic_metrics FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Trigger para updated_at
CREATE TRIGGER update_traffic_metrics_updated_at
  BEFORE UPDATE ON public.traffic_metrics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();