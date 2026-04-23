ALTER TABLE public.creative_demands
ADD COLUMN campaign_id uuid REFERENCES public.campaigns(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_creative_demands_campaign_id ON public.creative_demands(campaign_id);