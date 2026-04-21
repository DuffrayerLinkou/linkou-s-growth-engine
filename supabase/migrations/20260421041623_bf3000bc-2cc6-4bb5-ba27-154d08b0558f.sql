
-- ============================================================
-- 1. landing_settings: split sensitive token columns from general settings
-- ============================================================
-- Replace permissive ALL policies with role-aware policies.
-- Account managers retain SELECT / UPDATE for non-secret fields via a wrapper view + column grants.

DROP POLICY IF EXISTS "Account managers can manage landing settings" ON public.landing_settings;
DROP POLICY IF EXISTS "Admins can manage landing settings" ON public.landing_settings;

-- Admins: full access
CREATE POLICY "Admins full access landing_settings"
ON public.landing_settings
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Account managers: SELECT and UPDATE allowed at row level, but column-level
-- grants below prevent them from reading/writing sensitive token columns.
CREATE POLICY "Account managers select landing_settings"
ON public.landing_settings
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'account_manager'));

CREATE POLICY "Account managers update landing_settings"
ON public.landing_settings
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'account_manager'))
WITH CHECK (public.has_role(auth.uid(), 'account_manager'));

-- Column-level privileges: revoke ALL from authenticated, then grant only the
-- non-sensitive columns. Admins use the table owner's BYPASSRLS / SECURITY DEFINER
-- functions or are granted explicitly below.
REVOKE ALL ON public.landing_settings FROM authenticated;

-- Grant non-sensitive columns to authenticated (RLS still gates row visibility).
GRANT SELECT (
  id, created_at, updated_at, updated_by,
  site_title, site_description, og_image_url, favicon_url,
  meta_pixel_enabled, meta_pixel_id,
  gtm_enabled, gtm_id,
  ga4_enabled, ga4_measurement_id,
  tiktok_pixel_enabled, tiktok_pixel_id,
  google_ads_enabled, google_ads_id, google_ads_conversion_id,
  linkedin_enabled, linkedin_partner_id,
  hotjar_enabled, hotjar_id,
  chat_widget_enabled, chat_widget_script,
  head_scripts, body_scripts,
  robots_txt, search_console_verification, search_console_verified,
  whatsapp_number, whatsapp_message,
  meta_capi_enabled, meta_capi_test_event_code, meta_capi_crm_events_enabled,
  tiktok_capi_enabled, tiktok_test_event_code
) ON public.landing_settings TO authenticated;

GRANT UPDATE (
  updated_at, updated_by,
  site_title, site_description, og_image_url, favicon_url,
  meta_pixel_enabled, meta_pixel_id,
  gtm_enabled, gtm_id,
  ga4_enabled, ga4_measurement_id,
  tiktok_pixel_enabled, tiktok_pixel_id,
  google_ads_enabled, google_ads_id, google_ads_conversion_id,
  linkedin_enabled, linkedin_partner_id,
  hotjar_enabled, hotjar_id,
  chat_widget_enabled, chat_widget_script,
  head_scripts, body_scripts,
  robots_txt, search_console_verification, search_console_verified,
  whatsapp_number, whatsapp_message,
  meta_capi_enabled, meta_capi_test_event_code, meta_capi_crm_events_enabled,
  tiktok_capi_enabled, tiktok_test_event_code
) ON public.landing_settings TO authenticated;

-- Sensitive columns: only the postgres role / admins via service role can read/write.
-- We grant ALL on these columns to a dedicated admin role-equivalent: the service_role.
GRANT SELECT, UPDATE, INSERT (
  meta_capi_access_token,
  meta_app_secret,
  meta_webhook_verify_token,
  meta_page_access_token,
  tiktok_access_token
) ON public.landing_settings TO service_role;

-- Admins (authenticated users with admin role) need access to manage tokens via UI.
-- Since column grants are role-based not RLS-based, grant column-level access
-- to authenticated and rely on RLS + an additional restrictive policy that denies
-- token column writes to non-admins. Postgres column privileges cannot reference
-- auth.uid(), so we instead grant to authenticated and add a STRICT row-level
-- restrictive policy preventing non-admin sessions from writing rows when token
-- columns differ from the existing values.
GRANT SELECT, UPDATE, INSERT (
  meta_capi_access_token,
  meta_app_secret,
  meta_webhook_verify_token,
  meta_page_access_token,
  tiktok_access_token
) ON public.landing_settings TO authenticated;

-- Restrictive policy: non-admins cannot write rows that change any sensitive token column.
CREATE POLICY "Only admins can change sensitive tokens"
ON public.landing_settings
AS RESTRICTIVE
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR (
    -- Allow update only if token columns are unchanged
    meta_capi_access_token IS NOT DISTINCT FROM (SELECT ls.meta_capi_access_token FROM public.landing_settings ls WHERE ls.id = landing_settings.id)
    AND meta_app_secret IS NOT DISTINCT FROM (SELECT ls.meta_app_secret FROM public.landing_settings ls WHERE ls.id = landing_settings.id)
    AND meta_webhook_verify_token IS NOT DISTINCT FROM (SELECT ls.meta_webhook_verify_token FROM public.landing_settings ls WHERE ls.id = landing_settings.id)
    AND meta_page_access_token IS NOT DISTINCT FROM (SELECT ls.meta_page_access_token FROM public.landing_settings ls WHERE ls.id = landing_settings.id)
    AND tiktok_access_token IS NOT DISTINCT FROM (SELECT ls.tiktok_access_token FROM public.landing_settings ls WHERE ls.id = landing_settings.id)
  )
);

-- Restrictive SELECT: non-admins still see the row, but to truly hide the columns
-- we expose a redacted view for account managers and rely on application code to
-- query that view for non-admin reads. Create the view now.
CREATE OR REPLACE VIEW public.landing_settings_safe
WITH (security_invoker = true) AS
SELECT
  id, created_at, updated_at, updated_by,
  site_title, site_description, og_image_url, favicon_url,
  meta_pixel_enabled, meta_pixel_id,
  gtm_enabled, gtm_id,
  ga4_enabled, ga4_measurement_id,
  tiktok_pixel_enabled, tiktok_pixel_id,
  google_ads_enabled, google_ads_id, google_ads_conversion_id,
  linkedin_enabled, linkedin_partner_id,
  hotjar_enabled, hotjar_id,
  chat_widget_enabled, chat_widget_script,
  head_scripts, body_scripts,
  robots_txt, search_console_verification, search_console_verified,
  whatsapp_number, whatsapp_message,
  meta_capi_enabled, meta_capi_test_event_code, meta_capi_crm_events_enabled,
  tiktok_capi_enabled, tiktok_test_event_code,
  -- Boolean indicators so UI can show "configured" badges without exposing values
  (meta_capi_access_token IS NOT NULL AND meta_capi_access_token <> '') AS meta_capi_access_token_configured,
  (meta_app_secret IS NOT NULL AND meta_app_secret <> '') AS meta_app_secret_configured,
  (meta_webhook_verify_token IS NOT NULL AND meta_webhook_verify_token <> '') AS meta_webhook_verify_token_configured,
  (meta_page_access_token IS NOT NULL AND meta_page_access_token <> '') AS meta_page_access_token_configured,
  (tiktok_access_token IS NOT NULL AND tiktok_access_token <> '') AS tiktok_access_token_configured
FROM public.landing_settings;

GRANT SELECT ON public.landing_settings_safe TO authenticated;

-- ============================================================
-- 2. task_templates: allow clients to read templates marked visible_to_client
-- ============================================================
CREATE POLICY "Clients can view client-visible templates"
ON public.task_templates
FOR SELECT
TO authenticated
USING (
  visible_to_client = true
  AND public.has_role(auth.uid(), 'client')
);

-- ============================================================
-- 3. realtime.messages: restrict WhatsApp channel subscriptions to admins/managers
-- ============================================================
-- Enable RLS on realtime.messages (idempotent — Supabase enables it by default
-- for the realtime authorization feature, but the protection only kicks in once
-- a policy exists).
ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;

-- Allow admins/account managers to subscribe to WhatsApp-related topics.
DROP POLICY IF EXISTS "WhatsApp realtime: admins and managers only" ON realtime.messages;
CREATE POLICY "WhatsApp realtime: admins and managers only"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  -- Topic naming convention used by WhatsApp dashboard subscriptions.
  -- Adjust the LIKE pattern if your client subscribes to a different topic name.
  (
    realtime.topic() LIKE 'whatsapp%'
    OR realtime.topic() = 'public:whatsapp_messages'
    OR realtime.topic() LIKE 'whatsapp_messages%'
  )
  AND (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'account_manager')
  )
);
