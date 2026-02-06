
-- Templates para Site e Landing Page
INSERT INTO public.task_templates (service_type, journey_phase, title, description, order_index, priority, is_active, visible_to_client) VALUES
-- Briefing
('site', 'briefing', 'Reunião de briefing do projeto', 'Alinhar expectativas, objetivos e escopo do site/landing page', 1, 'high', true, true),
('site', 'briefing', 'Definir objetivos e público-alvo', 'Documentar metas de conversão e perfil do visitante ideal', 2, 'high', true, false),
('site', 'briefing', 'Levantar conteúdos e referências', 'Coletar textos, imagens e sites de referência do cliente', 3, 'medium', true, true),
-- Wireframe
('site', 'wireframe', 'Criar wireframe das páginas', 'Estruturar layout e hierarquia de informações', 4, 'high', true, false),
('site', 'wireframe', 'Aprovar estrutura com cliente', 'Apresentar wireframe e coletar feedback', 5, 'high', true, true),
-- Desenvolvimento
('site', 'desenvolvimento', 'Desenvolvimento do layout', 'Implementar design visual sobre o wireframe aprovado', 6, 'high', true, false),
('site', 'desenvolvimento', 'Implementação responsiva', 'Garantir funcionamento em mobile, tablet e desktop', 7, 'high', true, false),
('site', 'desenvolvimento', 'Integração de formulários e tracking', 'Configurar formulários de contato, pixels e analytics', 8, 'medium', true, false),
-- Revisão
('site', 'revisao', 'Revisão com cliente', 'Apresentar versão final e coletar ajustes', 9, 'high', true, true),
('site', 'revisao', 'Ajustes finais', 'Implementar correções solicitadas pelo cliente', 10, 'medium', true, false),
-- Publicação
('site', 'publicacao', 'Configurar domínio e hospedagem', 'Setup de DNS, SSL e ambiente de produção', 11, 'high', true, false),
('site', 'publicacao', 'Publicar e testar', 'Deploy final e testes de funcionamento em produção', 12, 'high', true, true),

-- Templates para Aplicação Web (IA)
-- Descoberta
('webapp', 'descoberta', 'Definir escopo e funcionalidades', 'Mapear requisitos e funcionalidades da aplicação', 1, 'high', true, true),
('webapp', 'descoberta', 'Mapear fluxos do usuário', 'Desenhar jornadas e fluxos principais da aplicação', 2, 'high', true, false),
('webapp', 'descoberta', 'Definir stack e integração com IA', 'Escolher tecnologias e definir uso de IA no projeto', 3, 'medium', true, false),
-- Protótipo
('webapp', 'prototipo', 'Criar protótipo navegável', 'Desenvolver versão inicial navegável da aplicação', 4, 'high', true, false),
('webapp', 'prototipo', 'Validar com cliente', 'Apresentar protótipo e coletar feedback', 5, 'high', true, true),
-- Desenvolvimento
('webapp', 'desenvolvimento', 'Desenvolvimento com Lovable/IA', 'Construir a aplicação utilizando ferramentas de IA', 6, 'high', true, false),
('webapp', 'desenvolvimento', 'Integrações (Supabase, APIs)', 'Configurar banco de dados, autenticação e APIs externas', 7, 'high', true, false),
('webapp', 'desenvolvimento', 'Ajustes de UI/UX', 'Refinar interface e experiência do usuário', 8, 'medium', true, false),
-- Testes
('webapp', 'testes', 'Testes funcionais', 'Testar todas as funcionalidades e fluxos da aplicação', 9, 'high', true, false),
('webapp', 'testes', 'Revisão com cliente', 'Apresentar aplicação completa e coletar ajustes finais', 10, 'high', true, true),
-- Deploy
('webapp', 'deploy', 'Deploy em produção', 'Publicar aplicação no ambiente definitivo', 11, 'high', true, false),
('webapp', 'deploy', 'Treinamento do usuário', 'Capacitar o cliente para usar e gerenciar a aplicação', 12, 'high', true, true);
