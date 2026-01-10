
-- Add approval fields to experiments table
ALTER TABLE public.experiments 
ADD COLUMN IF NOT EXISTS approved_by_ponto_focal boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES public.profiles(id);

-- Add approval fields to learnings table
ALTER TABLE public.learnings 
ADD COLUMN IF NOT EXISTS approved_by_ponto_focal boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES public.profiles(id);

-- Create comments table for experiments and learnings
CREATE TABLE public.comments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  entity_type text NOT NULL CHECK (entity_type IN ('experiment', 'learning')),
  entity_id uuid NOT NULL,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_comments_entity ON public.comments(entity_type, entity_id);
CREATE INDEX idx_comments_client ON public.comments(client_id);

-- Enable RLS
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for comments
-- Clients can view comments for their client
CREATE POLICY "Client users can view their client comments"
ON public.comments
FOR SELECT
USING (client_id = get_user_client_id(auth.uid()));

-- Ponto focal can create comments
CREATE POLICY "Ponto focal can create comments"
ON public.comments
FOR INSERT
WITH CHECK (
  is_ponto_focal(auth.uid(), client_id) 
  AND user_id = auth.uid()
);

-- Ponto focal can update their own comments
CREATE POLICY "Ponto focal can update their own comments"
ON public.comments
FOR UPDATE
USING (user_id = auth.uid() AND is_ponto_focal(auth.uid(), client_id));

-- Ponto focal can delete their own comments
CREATE POLICY "Ponto focal can delete their own comments"
ON public.comments
FOR DELETE
USING (user_id = auth.uid() AND is_ponto_focal(auth.uid(), client_id));

-- Admins can manage all comments
CREATE POLICY "Admins can manage all comments"
ON public.comments
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Account managers can manage all comments
CREATE POLICY "Account managers can manage all comments"
ON public.comments
FOR ALL
USING (has_role(auth.uid(), 'account_manager'));

-- Trigger for updated_at
CREATE TRIGGER update_comments_updated_at
BEFORE UPDATE ON public.comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for client files
INSERT INTO storage.buckets (id, name, public)
VALUES ('client-files', 'client-files', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for client-files bucket
-- Users can view files for their client
CREATE POLICY "Users can view their client files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'client-files' 
  AND (
    has_role(auth.uid(), 'admin') 
    OR has_role(auth.uid(), 'account_manager')
    OR (storage.foldername(name))[1]::uuid = get_user_client_id(auth.uid())
  )
);

-- Users can download files for their client
CREATE POLICY "Users can download their client files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'client-files'
  AND (
    has_role(auth.uid(), 'admin')
    OR has_role(auth.uid(), 'account_manager')
    OR (storage.foldername(name))[1]::uuid = get_user_client_id(auth.uid())
  )
);

-- Admins and account managers can upload files
CREATE POLICY "Admins can upload client files"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'client-files'
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'account_manager'))
);

-- Admins and account managers can delete files
CREATE POLICY "Admins can delete client files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'client-files'
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'account_manager'))
);

-- Add RLS policy for ponto focal to approve experiments
CREATE POLICY "Ponto focal can approve experiments"
ON public.experiments
FOR UPDATE
USING (
  is_ponto_focal(auth.uid(), client_id) 
  AND status = 'completed'
)
WITH CHECK (
  is_ponto_focal(auth.uid(), client_id)
);

-- Add RLS policy for ponto focal to approve learnings
CREATE POLICY "Ponto focal can approve learnings"
ON public.learnings
FOR UPDATE
USING (is_ponto_focal(auth.uid(), client_id))
WITH CHECK (is_ponto_focal(auth.uid(), client_id));
