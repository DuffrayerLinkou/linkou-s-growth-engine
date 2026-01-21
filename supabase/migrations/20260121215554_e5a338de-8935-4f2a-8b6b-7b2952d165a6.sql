-- Adicionar colunas para Meta Conversions API (CAPI)
ALTER TABLE public.landing_settings 
ADD COLUMN IF NOT EXISTS meta_capi_enabled BOOLEAN DEFAULT false;

ALTER TABLE public.landing_settings 
ADD COLUMN IF NOT EXISTS meta_capi_access_token TEXT;

ALTER TABLE public.landing_settings 
ADD COLUMN IF NOT EXISTS meta_capi_test_event_code TEXT;