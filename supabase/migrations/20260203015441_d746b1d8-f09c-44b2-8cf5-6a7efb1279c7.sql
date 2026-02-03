-- Adicionar coluna service_type na tabela task_templates
ALTER TABLE public.task_templates 
ADD COLUMN service_type text NOT NULL DEFAULT 'auditoria';

-- Comentário na coluna
COMMENT ON COLUMN public.task_templates.service_type IS 
  'Tipo de serviço: auditoria, producao, gestao, design';

-- Inserir templates iniciais para Produção de Mídia
INSERT INTO public.task_templates (service_type, journey_phase, title, description, priority, order_index, visible_to_client) VALUES
-- Fase Briefing
('producao', 'briefing', 'Reunião de briefing criativo', 'Reunião inicial para entender objetivos, público-alvo e expectativas do cliente', 'high', 1, true),
('producao', 'briefing', 'Definir público-alvo e tom de voz', 'Documentar personas e definir tom de comunicação para as peças', 'high', 2, true),
('producao', 'briefing', 'Coletar referências visuais', 'Reunir referências de design e estilo aprovadas pelo cliente', 'medium', 3, true),
('producao', 'briefing', 'Definir formatos e especificações', 'Listar todos os formatos e tamanhos necessários para cada plataforma', 'medium', 4, true),
-- Fase Produção
('producao', 'producao', 'Criação de peças estáticas', 'Desenvolvimento de imagens para anúncios e posts', 'high', 1, true),
('producao', 'producao', 'Produção de vídeos', 'Edição e produção de vídeos para campanhas', 'high', 2, true),
('producao', 'producao', 'Redação de copies', 'Criação de textos persuasivos para anúncios', 'high', 3, true),
-- Fase Revisão
('producao', 'revisao', 'Enviar materiais para aprovação', 'Compartilhar peças produzidas com o cliente para feedback', 'high', 1, true),
('producao', 'revisao', 'Coletar feedback do cliente', 'Documentar todas as alterações solicitadas', 'medium', 2, true),
('producao', 'revisao', 'Realizar ajustes solicitados', 'Implementar alterações conforme feedback recebido', 'high', 3, true),
-- Fase Entrega
('producao', 'entrega', 'Preparar pacote final de assets', 'Organizar todos os arquivos finais em formatos adequados', 'high', 1, true),
('producao', 'entrega', 'Entregar materiais ao cliente', 'Disponibilizar arquivos finais via Drive ou plataforma acordada', 'high', 2, true),

-- Inserir templates para Gestão de Tráfego
-- Fase Onboarding
('gestao', 'onboarding', 'Solicitar acessos às contas', 'Obter acesso às contas de anúncios (Meta, Google, TikTok)', 'urgent', 1, true),
('gestao', 'onboarding', 'Conhecer produto/serviço do cliente', 'Entender oferta, diferenciais e proposta de valor', 'high', 2, true),
('gestao', 'onboarding', 'Definir metas e KPIs', 'Estabelecer objetivos mensuráveis para as campanhas', 'high', 3, true),
('gestao', 'onboarding', 'Mapear concorrentes', 'Analisar estratégias de mídia paga dos principais concorrentes', 'medium', 4, true),
-- Fase Setup
('gestao', 'setup', 'Auditoria de contas existentes', 'Revisar campanhas anteriores e identificar oportunidades', 'high', 1, true),
('gestao', 'setup', 'Configurar pixels e eventos', 'Implementar tracking correto em todas as plataformas', 'urgent', 2, true),
('gestao', 'setup', 'Criar estrutura de campanhas', 'Montar campanhas, conjuntos e anúncios conforme estratégia', 'high', 3, true),
('gestao', 'setup', 'Configurar públicos-alvo', 'Criar audiências personalizadas e lookalikes', 'high', 4, true),
-- Fase Otimização
('gestao', 'otimizacao', 'Análise semanal de performance', 'Revisar métricas e identificar pontos de melhoria', 'high', 1, true),
('gestao', 'otimizacao', 'Otimizar criativos', 'Pausar criativos ruins e escalar os que performam', 'high', 2, true),
('gestao', 'otimizacao', 'Ajustar orçamentos', 'Redistribuir budget entre campanhas conforme resultados', 'medium', 3, true),
('gestao', 'otimizacao', 'Testar novas abordagens', 'Implementar testes A/B de copies, imagens e públicos', 'medium', 4, true),
-- Fase Escala
('gestao', 'escala', 'Relatório mensal de resultados', 'Preparar dashboard com métricas e insights do período', 'high', 1, true),
('gestao', 'escala', 'Planejamento de escala', 'Definir estratégia para aumentar investimento mantendo ROI', 'high', 2, true),
('gestao', 'escala', 'Expandir para novas plataformas', 'Avaliar e implementar campanhas em novos canais', 'medium', 3, true),

-- Inserir templates para Design
-- Fase Descoberta
('design', 'descoberta', 'Briefing de marca', 'Reunião para entender valores, missão e visão do cliente', 'high', 1, true),
('design', 'descoberta', 'Pesquisa de mercado', 'Analisar tendências e referências do segmento', 'high', 2, true),
('design', 'descoberta', 'Análise de concorrentes', 'Estudar identidades visuais de players do mercado', 'medium', 3, true),
('design', 'descoberta', 'Definir entregáveis', 'Listar todos os itens que serão desenvolvidos', 'high', 4, true),
-- Fase Conceito
('design', 'conceito', 'Criar moodboard', 'Desenvolver painel visual de referências e direcionamento', 'high', 1, true),
('design', 'conceito', 'Definir paleta de cores', 'Selecionar cores principais e secundárias da marca', 'high', 2, true),
('design', 'conceito', 'Selecionar tipografia', 'Escolher fontes para títulos e textos', 'high', 3, true),
('design', 'conceito', 'Apresentar conceitos iniciais', 'Mostrar 2-3 direções criativas para o cliente escolher', 'high', 4, true),
-- Fase Desenvolvimento
('design', 'desenvolvimento', 'Desenvolver logo', 'Criar versões do logotipo conforme conceito aprovado', 'high', 1, true),
('design', 'desenvolvimento', 'Criar aplicações da marca', 'Desenvolver papelaria, social media e materiais', 'high', 2, true),
('design', 'desenvolvimento', 'Montar manual de identidade', 'Documentar regras de uso da marca', 'medium', 3, true),
-- Fase Entrega
('design', 'entrega', 'Revisão final com cliente', 'Apresentar todos os materiais para aprovação final', 'high', 1, true),
('design', 'entrega', 'Preparar arquivos finais', 'Exportar em todos os formatos necessários', 'high', 2, true),
('design', 'entrega', 'Entregar brand book', 'Disponibilizar manual e assets organizados', 'high', 3, true);