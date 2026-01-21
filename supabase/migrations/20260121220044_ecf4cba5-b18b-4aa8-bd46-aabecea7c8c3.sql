-- Adicionar colunas para TikTok Events API
ALTER TABLE public.landing_settings 
ADD COLUMN IF NOT EXISTS tiktok_capi_enabled BOOLEAN DEFAULT false;

ALTER TABLE public.landing_settings 
ADD COLUMN IF NOT EXISTS tiktok_access_token TEXT;

ALTER TABLE public.landing_settings 
ADD COLUMN IF NOT EXISTS tiktok_test_event_code TEXT;