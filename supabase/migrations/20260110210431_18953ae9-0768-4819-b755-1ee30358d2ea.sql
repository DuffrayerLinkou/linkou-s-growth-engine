-- Create landing_settings table (singleton pattern)
CREATE TABLE public.landing_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Meta Pixel (Facebook/Instagram)
  meta_pixel_id TEXT,
  meta_pixel_enabled BOOLEAN DEFAULT false,
  
  -- TikTok Pixel
  tiktok_pixel_id TEXT,
  tiktok_pixel_enabled BOOLEAN DEFAULT false,
  
  -- Google Ads
  google_ads_id TEXT,
  google_ads_conversion_id TEXT,
  google_ads_enabled BOOLEAN DEFAULT false,
  
  -- LinkedIn Insight Tag
  linkedin_partner_id TEXT,
  linkedin_enabled BOOLEAN DEFAULT false,
  
  -- Google Tag Manager
  gtm_id TEXT,
  gtm_enabled BOOLEAN DEFAULT false,
  
  -- Google Analytics 4
  ga4_measurement_id TEXT,
  ga4_enabled BOOLEAN DEFAULT false,
  
  -- Search Console
  search_console_verification TEXT,
  search_console_verified BOOLEAN DEFAULT false,
  
  -- SEO Settings
  site_title TEXT,
  site_description TEXT,
  og_image_url TEXT,
  favicon_url TEXT,
  robots_txt TEXT,
  
  -- Custom Scripts
  head_scripts TEXT,
  body_scripts TEXT,
  
  -- Chat Widget
  chat_widget_enabled BOOLEAN DEFAULT false,
  chat_widget_script TEXT,
  
  -- Hotjar
  hotjar_id TEXT,
  hotjar_enabled BOOLEAN DEFAULT false,
  
  -- WhatsApp
  whatsapp_number TEXT,
  whatsapp_message TEXT,
  
  -- Metadata
  updated_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.landing_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Only admins and account managers can manage
CREATE POLICY "Admins can manage landing settings"
  ON public.landing_settings
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Account managers can manage landing settings"
  ON public.landing_settings
  FOR ALL
  USING (has_role(auth.uid(), 'account_manager'::app_role));

-- Public can read (for tracking scripts injection)
CREATE POLICY "Anyone can view landing settings"
  ON public.landing_settings
  FOR SELECT
  USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_landing_settings_updated_at
  BEFORE UPDATE ON public.landing_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default singleton record
INSERT INTO public.landing_settings (id) VALUES (gen_random_uuid());