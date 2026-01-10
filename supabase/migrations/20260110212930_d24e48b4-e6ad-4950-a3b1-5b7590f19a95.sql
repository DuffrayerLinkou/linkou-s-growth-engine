-- Rename experiments table to campaigns and update references
-- First, add new columns to experiments table to make it more campaign-focused
ALTER TABLE public.experiments 
  ADD COLUMN IF NOT EXISTS platform text,
  ADD COLUMN IF NOT EXISTS objective text,
  ADD COLUMN IF NOT EXISTS budget numeric;

-- Add comment to clarify the table is now for campaigns
COMMENT ON TABLE public.experiments IS 'Marketing campaigns (formerly experiments)';
COMMENT ON COLUMN public.experiments.platform IS 'Platform: meta, google, tiktok, linkedin';
COMMENT ON COLUMN public.experiments.objective IS 'Campaign objective: leads, vendas, trafego, reconhecimento';
COMMENT ON COLUMN public.experiments.budget IS 'Campaign budget';