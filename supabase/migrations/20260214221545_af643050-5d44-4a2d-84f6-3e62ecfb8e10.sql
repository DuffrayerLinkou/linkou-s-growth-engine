
-- ============================================
-- 1. SECURITY: Restrict landing_settings public access
-- ============================================

-- Drop the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Anyone can view landing settings" ON public.landing_settings;

-- Create a secure function that returns only public tracking IDs (no tokens/secrets)
CREATE OR REPLACE FUNCTION public.get_public_tracking_config()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'meta_pixel_enabled', meta_pixel_enabled,
    'meta_pixel_id', meta_pixel_id,
    'gtm_enabled', gtm_enabled,
    'gtm_id', gtm_id,
    'ga4_enabled', ga4_enabled,
    'ga4_measurement_id', ga4_measurement_id,
    'tiktok_pixel_enabled', tiktok_pixel_enabled,
    'tiktok_pixel_id', tiktok_pixel_id,
    'google_ads_enabled', google_ads_enabled,
    'google_ads_id', google_ads_id,
    'linkedin_enabled', linkedin_enabled,
    'linkedin_partner_id', linkedin_partner_id,
    'hotjar_enabled', hotjar_enabled,
    'hotjar_id', hotjar_id,
    'chat_widget_enabled', chat_widget_enabled,
    'chat_widget_script', chat_widget_script,
    'head_scripts', head_scripts,
    'body_scripts', body_scripts,
    'site_title', site_title,
    'site_description', site_description,
    'og_image_url', og_image_url,
    'favicon_url', favicon_url,
    'whatsapp_number', whatsapp_number,
    'whatsapp_message', whatsapp_message,
    'search_console_verification', search_console_verification
  )
  FROM public.landing_settings
  LIMIT 1;
$$;

-- Grant execute to anon and authenticated
GRANT EXECUTE ON FUNCTION public.get_public_tracking_config() TO anon, authenticated;

-- ============================================
-- 2. SECURITY: Restrict capture_pages public access
-- ============================================

-- Drop the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Anyone can view active capture pages" ON public.capture_pages;

-- Create a secure function that returns only rendering fields for a capture page
CREATE OR REPLACE FUNCTION public.get_capture_page_by_slug(_slug text)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'id', id,
    'title', title,
    'slug', slug,
    'headline', headline,
    'subheadline', subheadline,
    'benefits', benefits,
    'button_text', button_text,
    'thank_you_message', thank_you_message,
    'thank_you_redirect_url', thank_you_redirect_url,
    'primary_color', primary_color,
    'background_color', background_color,
    'text_color', text_color,
    'logo_url', logo_url,
    'background_image_url', background_image_url,
    'form_fields', form_fields,
    'meta_title', meta_title,
    'meta_description', meta_description,
    'video_url', video_url,
    'layout_type', layout_type
  )
  FROM public.capture_pages
  WHERE slug = _slug AND is_active = true
  LIMIT 1;
$$;

-- Grant execute to anon and authenticated
GRANT EXECUTE ON FUNCTION public.get_capture_page_by_slug(text) TO anon, authenticated;
