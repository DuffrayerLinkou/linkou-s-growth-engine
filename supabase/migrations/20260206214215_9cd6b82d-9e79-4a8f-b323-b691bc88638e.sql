
-- 1. lead_activities - Histórico de Interações
CREATE TABLE public.lead_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all lead_activities"
  ON public.lead_activities FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Account managers can manage all lead_activities"
  ON public.lead_activities FOR ALL
  USING (has_role(auth.uid(), 'account_manager'::app_role));

CREATE INDEX idx_lead_activities_lead_id ON public.lead_activities(lead_id);
CREATE INDEX idx_lead_activities_created_at ON public.lead_activities(created_at DESC);

-- 2. lead_follow_ups - Agendamento de Follow-ups
CREATE TABLE public.lead_follow_ups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  type TEXT NOT NULL DEFAULT 'whatsapp',
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.lead_follow_ups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all lead_follow_ups"
  ON public.lead_follow_ups FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Account managers can manage all lead_follow_ups"
  ON public.lead_follow_ups FOR ALL
  USING (has_role(auth.uid(), 'account_manager'::app_role));

CREATE INDEX idx_lead_follow_ups_lead_id ON public.lead_follow_ups(lead_id);
CREATE INDEX idx_lead_follow_ups_scheduled ON public.lead_follow_ups(scheduled_at) WHERE status = 'pending';

-- 3. whatsapp_templates - Templates de Mensagem
CREATE TABLE public.whatsapp_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'follow_up',
  content TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all whatsapp_templates"
  ON public.whatsapp_templates FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Account managers can manage all whatsapp_templates"
  ON public.whatsapp_templates FOR ALL
  USING (has_role(auth.uid(), 'account_manager'::app_role));

-- 4. Inserir templates padrão
INSERT INTO public.whatsapp_templates (name, category, content) VALUES
  ('Boas-vindas', 'welcome', 'Olá {{nome}}! Sou da Linkou, recebi seu contato sobre {{objetivo}}. Podemos conversar?'),
  ('Follow-up', 'follow_up', 'Oi {{nome}}, tudo bem? Estou retomando nosso contato sobre {{objetivo}}. Tem um horário disponível essa semana?'),
  ('Qualificação', 'qualification', '{{nome}}, analisei seu caso e acredito que podemos ajudar com {{segmento}}. Posso enviar uma proposta?'),
  ('Proposta', 'proposal', '{{nome}}, preparei uma proposta personalizada para você. Podemos agendar uma reunião para apresentar?');
