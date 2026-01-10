-- Create task_templates table
CREATE TABLE public.task_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_phase TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium',
  order_index INTEGER DEFAULT 0,
  visible_to_client BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.task_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage all templates"
ON public.task_templates
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Account managers can view templates"
ON public.task_templates
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'account_manager'));

-- Trigger for updated_at
CREATE TRIGGER update_task_templates_updated_at
BEFORE UPDATE ON public.task_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed data: Diagnóstico
INSERT INTO public.task_templates (journey_phase, title, description, priority, order_index, visible_to_client) VALUES
('diagnostico', 'Mapear funil atual de vendas', 'Documentar todas as etapas do funil de vendas atual do cliente, incluindo canais de aquisição, pontos de contato e taxas de conversão.', 'high', 1, true),
('diagnostico', 'Identificar gargalos de conversão', 'Analisar dados para identificar onde estão as maiores perdas no funil e oportunidades de melhoria.', 'high', 2, true),
('diagnostico', 'Auditar integrações existentes', 'Verificar todas as ferramentas e integrações atuais (CRM, analytics, automações) e seu funcionamento.', 'medium', 3, true),
('diagnostico', 'Levantar dados históricos', 'Coletar e organizar dados históricos de vendas, leads e métricas relevantes.', 'medium', 4, true),
('diagnostico', 'Documentar processos atuais', 'Criar documentação detalhada dos processos de vendas e marketing atuais.', 'medium', 5, true);

-- Seed data: Estruturação
INSERT INTO public.task_templates (journey_phase, title, description, priority, order_index, visible_to_client) VALUES
('estruturacao', 'Configurar tracking e analytics', 'Implementar e configurar ferramentas de tracking para monitorar todas as conversões e eventos importantes.', 'high', 1, true),
('estruturacao', 'Integrar CRM e ferramentas', 'Conectar e sincronizar todas as ferramentas necessárias (CRM, automação, analytics).', 'high', 2, true),
('estruturacao', 'Estruturar funil no sistema', 'Configurar as etapas do novo funil otimizado nas ferramentas selecionadas.', 'high', 3, true),
('estruturacao', 'Definir KPIs e dashboards', 'Estabelecer métricas-chave e criar dashboards para acompanhamento em tempo real.', 'medium', 4, true),
('estruturacao', 'Validar coleta de dados', 'Testar e validar que todos os dados estão sendo coletados corretamente.', 'medium', 5, true);

-- Seed data: Operação Guiada
INSERT INTO public.task_templates (journey_phase, title, description, priority, order_index, visible_to_client) VALUES
('operacao_guiada', 'Rodar primeiro teste A/B', 'Planejar e executar o primeiro experimento para validar hipóteses de otimização.', 'high', 1, true),
('operacao_guiada', 'Analisar resultados iniciais', 'Avaliar os resultados dos primeiros experimentos e definir próximos passos.', 'high', 2, true),
('operacao_guiada', 'Treinar ponto focal', 'Capacitar o ponto focal do cliente para operar as ferramentas e processos implementados.', 'high', 3, true),
('operacao_guiada', 'Otimizar campanhas', 'Aplicar melhorias nas campanhas com base nos dados coletados.', 'medium', 4, true),
('operacao_guiada', 'Documentar aprendizados', 'Registrar todos os insights e aprendizados obtidos durante a operação.', 'medium', 5, true);

-- Seed data: Transferência
INSERT INTO public.task_templates (journey_phase, title, description, priority, order_index, visible_to_client) VALUES
('transferencia', 'Criar documentação final', 'Elaborar documentação completa de todos os processos, ferramentas e configurações.', 'high', 1, true),
('transferencia', 'Transferir acessos', 'Garantir que o cliente tenha todos os acessos necessários às ferramentas e dados.', 'high', 2, true),
('transferencia', 'Sessão final de treinamento', 'Realizar treinamento completo com a equipe do cliente sobre operação independente.', 'high', 3, true),
('transferencia', 'Entregar playbook', 'Fornecer playbook com boas práticas, processos e guias de troubleshooting.', 'medium', 4, true),
('transferencia', 'Definir suporte pós-projeto', 'Alinhar expectativas e canais de suporte após o encerramento do projeto.', 'low', 5, true);