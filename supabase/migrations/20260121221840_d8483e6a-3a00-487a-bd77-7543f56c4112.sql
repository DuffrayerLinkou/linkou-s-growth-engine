-- Add Meta Lead Ads webhook configuration columns
ALTER TABLE public.landing_settings 
ADD COLUMN IF NOT EXISTS meta_webhook_verify_token text,
ADD COLUMN IF NOT EXISTS meta_app_secret text,
ADD COLUMN IF NOT EXISTS meta_page_access_token text;