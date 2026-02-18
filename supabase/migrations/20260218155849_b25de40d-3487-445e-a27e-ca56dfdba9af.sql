
-- Create email funnels table
CREATE TABLE public.email_funnels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create email funnel steps table
CREATE TABLE public.email_funnel_steps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  funnel_id UUID NOT NULL REFERENCES public.email_funnels(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL DEFAULT 1,
  delay_days INTEGER NOT NULL DEFAULT 1,
  subject TEXT NOT NULL,
  html_body TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create lead funnel enrollments table
CREATE TABLE public.lead_funnel_enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  funnel_id UUID NOT NULL REFERENCES public.email_funnels(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(lead_id, funnel_id)
);

-- Create lead funnel emails sent table
CREATE TABLE public.lead_funnel_emails_sent (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  enrollment_id UUID NOT NULL REFERENCES public.lead_funnel_enrollments(id) ON DELETE CASCADE,
  step_id UUID NOT NULL REFERENCES public.email_funnel_steps(id) ON DELETE CASCADE,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(enrollment_id, step_id)
);

-- Enable RLS
ALTER TABLE public.email_funnels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_funnel_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_funnel_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_funnel_emails_sent ENABLE ROW LEVEL SECURITY;

-- RLS for email_funnels
CREATE POLICY "Admins and managers can manage email funnels"
  ON public.email_funnels FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'account_manager'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'account_manager'::app_role));

-- RLS for email_funnel_steps
CREATE POLICY "Admins and managers can manage email funnel steps"
  ON public.email_funnel_steps FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'account_manager'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'account_manager'::app_role));

-- RLS for lead_funnel_enrollments
CREATE POLICY "Admins and managers can manage enrollments"
  ON public.lead_funnel_enrollments FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'account_manager'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'account_manager'::app_role));

-- RLS for lead_funnel_emails_sent
CREATE POLICY "Admins and managers can view emails sent"
  ON public.lead_funnel_emails_sent FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'account_manager'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'account_manager'::app_role));

-- Triggers for updated_at
CREATE TRIGGER update_email_funnels_updated_at
  BEFORE UPDATE ON public.email_funnels
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_email_funnel_steps_updated_at
  BEFORE UPDATE ON public.email_funnel_steps
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lead_funnel_enrollments_updated_at
  BEFORE UPDATE ON public.lead_funnel_enrollments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Default funnel with 4 steps
INSERT INTO public.email_funnels (id, name, description, is_active)
VALUES ('00000000-0000-0000-0000-000000000001', 'Funil Padrão Linkou', 'Sequência automática para novos leads captados na landing page e páginas de captura.', true);

INSERT INTO public.email_funnel_steps (funnel_id, step_number, delay_days, subject, html_body) VALUES
(
  '00000000-0000-0000-0000-000000000001', 1, 1,
  'Olá {{nome}}, conheça a Linkou 👋',
  '<h2>Olá, {{nome}}!</h2><p>Obrigado por entrar em contato com a Agência Linkou. Somos especialistas em tráfego pago e estratégias digitais que geram resultados reais.</p><p>Nos próximos dias, vou compartilhar com você alguns conteúdos que podem transformar sua visão sobre marketing digital.</p><p>Para começar: você sabia que a maioria dos negócios perde dinheiro em mídia paga por não ter uma estratégia clara? Vamos mudar isso juntos.</p><p>Qualquer dúvida, basta responder este email.</p><br><p>Abraços,<br><strong>Equipe Linkou</strong></p>'
),
(
  '00000000-0000-0000-0000-000000000001', 2, 3,
  '{{nome}}, você está deixando dinheiro na mesa?',
  '<h2>{{nome}}, uma pergunta direta:</h2><p>Você sabe exatamente quanto custa cada cliente que você conquista?</p><p>Se a resposta for "não" ou "mais ou menos", você provavelmente está investindo em mídia sem o controle necessário.</p><p>Na Linkou, trabalhamos com uma metodologia em 4 fases que vai desde o diagnóstico do seu negócio até a operação independente — com resultados mensuráveis em cada etapa.</p><ul><li>📊 <strong>Diagnóstico:</strong> entendemos seu cenário real</li><li>🏗️ <strong>Estruturação:</strong> criamos a base certa</li><li>🚀 <strong>Operação guiada:</strong> escalamos juntos</li><li>🎯 <strong>Transferência:</strong> você opera com autonomia</li></ul><p>Quer saber como isso se aplica ao seu segmento{{segmento}}?</p><p><a href="https://linkou.com.br/#contato" style="color:#7C3AED;font-weight:bold;">Vamos conversar →</a></p>'
),
(
  '00000000-0000-0000-0000-000000000001', 3, 7,
  'Resultado real: como um cliente {{segmento}} cresceu 3x em 6 meses',
  '<h2>Um case que vale a pena conhecer</h2><p>Olá, {{nome}}!</p><p>Vou compartilhar um resultado que nos orgulha muito:</p><blockquote style="border-left:4px solid #7C3AED;padding-left:16px;color:#555;"><em>"Antes da Linkou, investíamos R$ 8.000/mês sem saber o que funcionava. Hoje investimos R$ 15.000/mês com custo por lead 60% menor e 3x mais vendas."</em></blockquote><p>Isso foi possível porque aplicamos o nosso método de forma consistente — sem atalhos, sem promessas vazias.</p><p>Se você tem o objetivo de {{objetivo}}, a nossa metodologia pode ser exatamente o que você precisa.</p><p><strong>Que tal marcarmos uma conversa de 30 minutos?</strong></p><p><a href="https://linkou.com.br/#contato" style="color:#7C3AED;font-weight:bold;">Agendar conversa gratuita →</a></p>'
),
(
  '00000000-0000-0000-0000-000000000001', 4, 14,
  '{{nome}}, última chamada — vaga disponível esta semana',
  '<h2>{{nome}}, não quero que você perca essa oportunidade</h2><p>Há 14 dias você demonstrou interesse na Linkou. Quero entender se ainda faz sentido para você.</p><p>Trabalhamos com um número limitado de clientes por mês — isso garante que cada empresa receba a atenção que merece.</p><p>Se você está pronto para:</p><ul><li>✅ Parar de desperdiçar verba em mídia sem retorno</li><li>✅ Ter clareza sobre o que funciona no seu negócio</li><li>✅ Escalar de forma previsível e sustentável</li></ul><p>Então este é o momento certo.</p><p><a href="https://linkou.com.br/#contato" style="background:#7C3AED;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;">Quero começar agora →</a></p><br><p>Se não for o momento certo, sem problema — pode responder este email e me contar o que mudou. Estou aqui para ajudar.</p>'
);
