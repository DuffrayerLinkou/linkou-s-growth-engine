-- Remove o constraint antigo que só aceita 'experiment' e 'learning'
ALTER TABLE comments DROP CONSTRAINT IF EXISTS comments_entity_type_check;

-- Adiciona novo constraint aceitando 'campaign' no lugar de 'experiment'
ALTER TABLE comments ADD CONSTRAINT comments_entity_type_check 
  CHECK (entity_type = ANY (ARRAY['campaign'::text, 'learning'::text]));