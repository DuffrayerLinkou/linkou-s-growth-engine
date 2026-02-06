
-- Create whatsapp_messages table
CREATE TABLE public.whatsapp_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  wa_message_id TEXT UNIQUE,
  phone TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  type TEXT NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'template', 'image', 'document', 'audio', 'video', 'sticker', 'location', 'contacts')),
  content TEXT,
  template_name TEXT,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read', 'failed', 'pending')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create indexes for performance
CREATE INDEX idx_whatsapp_messages_phone ON public.whatsapp_messages(phone);
CREATE INDEX idx_whatsapp_messages_lead_id ON public.whatsapp_messages(lead_id);
CREATE INDEX idx_whatsapp_messages_direction ON public.whatsapp_messages(direction);
CREATE INDEX idx_whatsapp_messages_created_at ON public.whatsapp_messages(created_at DESC);
CREATE INDEX idx_whatsapp_messages_wa_message_id ON public.whatsapp_messages(wa_message_id);

-- Create whatsapp_config table (singleton)
CREATE TABLE public.whatsapp_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  webhook_configured BOOLEAN NOT NULL DEFAULT false,
  verify_token TEXT NOT NULL DEFAULT 'wh_' || encode(gen_random_bytes(16), 'hex'),
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default config row
INSERT INTO public.whatsapp_config (is_enabled, webhook_configured) VALUES (false, false);

-- Enable RLS
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_config ENABLE ROW LEVEL SECURITY;

-- RLS policies for whatsapp_messages (admin and account_manager only)
CREATE POLICY "Admins and managers can view all whatsapp messages"
  ON public.whatsapp_messages FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'account_manager'));

CREATE POLICY "Admins and managers can insert whatsapp messages"
  ON public.whatsapp_messages FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'account_manager'));

CREATE POLICY "Admins and managers can update whatsapp messages"
  ON public.whatsapp_messages FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'account_manager'));

-- RLS policies for whatsapp_config
CREATE POLICY "Admins and managers can view whatsapp config"
  ON public.whatsapp_config FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'account_manager'));

CREATE POLICY "Only admins can update whatsapp config"
  ON public.whatsapp_config FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Enable realtime for whatsapp_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_messages;

-- Trigger for updated_at on whatsapp_config
CREATE TRIGGER update_whatsapp_config_updated_at
  BEFORE UPDATE ON public.whatsapp_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
