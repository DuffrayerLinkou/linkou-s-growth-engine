-- Renomear tabela experiments para campaigns
ALTER TABLE experiments RENAME TO campaigns;

-- Adicionar novos campos específicos para plataformas de ads
ALTER TABLE campaigns 
  ADD COLUMN IF NOT EXISTS campaign_type text,
  ADD COLUMN IF NOT EXISTS objective_detail text,
  ADD COLUMN IF NOT EXISTS targeting jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS placements jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS creatives jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS daily_budget numeric,
  ADD COLUMN IF NOT EXISTS bidding_strategy text,
  ADD COLUMN IF NOT EXISTS target_cpa numeric,
  ADD COLUMN IF NOT EXISTS target_roas numeric,
  ADD COLUMN IF NOT EXISTS ad_copy text,
  ADD COLUMN IF NOT EXISTS headline text,
  ADD COLUMN IF NOT EXISTS call_to_action text;

-- Renomear hypothesis para strategy (melhor semântica)
ALTER TABLE campaigns RENAME COLUMN hypothesis TO strategy;

-- Comentários para documentação
COMMENT ON TABLE campaigns IS 'Campanhas de marketing digital';
COMMENT ON COLUMN campaigns.campaign_type IS 'Tipo: awareness, traffic, engagement, leads, sales, app_installs';
COMMENT ON COLUMN campaigns.platform IS 'Plataforma: meta_ads, google_ads, tiktok, linkedin';
COMMENT ON COLUMN campaigns.targeting IS 'Público-alvo: {age_min, age_max, gender, interests, locations, custom_audiences}';
COMMENT ON COLUMN campaigns.placements IS 'Posicionamentos: feed, stories, reels, search, display, youtube';
COMMENT ON COLUMN campaigns.creatives IS 'Criativos/anúncios configurados';
COMMENT ON COLUMN campaigns.bidding_strategy IS 'Estratégia: cpa, roas, cpc, cpm, maximize_clicks';
COMMENT ON COLUMN campaigns.strategy IS 'Estratégia/hipótese da campanha';

-- Atualizar RLS policies para usar novo nome da tabela
-- As policies são automaticamente renomeadas com a tabela, mas precisamos verificar os nomes

-- Atualizar comentários na tabela comments para suportar 'campaign' como entity_type
COMMENT ON COLUMN comments.entity_type IS 'Tipo de entidade: campaign, learning, task';