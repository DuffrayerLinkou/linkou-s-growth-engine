ALTER TABLE public.landing_settings 
ADD COLUMN IF NOT EXISTS meta_capi_crm_events_enabled BOOLEAN DEFAULT false;