
-- Tabela para páginas de captura editáveis
CREATE TABLE public.capture_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  headline TEXT NOT NULL DEFAULT '',
  subheadline TEXT DEFAULT '',
  benefits JSONB DEFAULT '[]'::jsonb,
  button_text TEXT DEFAULT 'Quero começar agora',
  thank_you_message TEXT DEFAULT 'Obrigado! Entraremos em contato em breve.',
  thank_you_redirect_url TEXT DEFAULT NULL,
  primary_color TEXT DEFAULT '#7C3AED',
  background_color TEXT DEFAULT '#0F0A1A',
  text_color TEXT DEFAULT '#FFFFFF',
  logo_url TEXT DEFAULT NULL,
  background_image_url TEXT DEFAULT NULL,
  form_fields JSONB DEFAULT '["name","email","phone"]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  meta_title TEXT DEFAULT NULL,
  meta_description TEXT DEFAULT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index para busca por slug
CREATE UNIQUE INDEX idx_capture_pages_slug ON public.capture_pages (slug);

-- Enable RLS
ALTER TABLE public.capture_pages ENABLE ROW LEVEL SECURITY;

-- Qualquer pessoa pode ver páginas ativas (rota pública)
CREATE POLICY "Anyone can view active capture pages"
ON public.capture_pages
FOR SELECT
USING (is_active = true);

-- Admins podem gerenciar todas
CREATE POLICY "Admins can manage all capture pages"
ON public.capture_pages
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Account managers podem gerenciar todas
CREATE POLICY "Account managers can manage all capture pages"
ON public.capture_pages
FOR ALL
USING (has_role(auth.uid(), 'account_manager'::app_role));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_capture_pages_updated_at
BEFORE UPDATE ON public.capture_pages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
