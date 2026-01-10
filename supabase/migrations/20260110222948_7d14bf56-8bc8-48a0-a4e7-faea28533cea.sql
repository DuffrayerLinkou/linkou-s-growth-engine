-- Add task_id column to files table for task attachments
ALTER TABLE public.files 
ADD COLUMN IF NOT EXISTS task_id uuid REFERENCES public.tasks(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.files.task_id IS 'Tarefa associada ao arquivo (opcional)';

-- Add category column to categorize uploads
ALTER TABLE public.files 
ADD COLUMN IF NOT EXISTS category text DEFAULT 'general';

COMMENT ON COLUMN public.files.category IS 'Categoria: general, campaign_asset, document_request, deliverable';

-- Create index for task_id lookups
CREATE INDEX IF NOT EXISTS idx_files_task_id ON public.files(task_id);

-- Create index for category lookups
CREATE INDEX IF NOT EXISTS idx_files_category ON public.files(category);

-- Policy for clients (ponto focal) to upload files for their client
CREATE POLICY "Clients can upload files for their client"
ON public.files
FOR INSERT
TO authenticated
WITH CHECK (
  client_id = public.get_user_client_id(auth.uid()) 
  AND public.is_ponto_focal(auth.uid(), client_id)
);

-- Policy for clients to view their own uploads
CREATE POLICY "Clients can view files for their client"
ON public.files
FOR SELECT
TO authenticated
USING (
  client_id = public.get_user_client_id(auth.uid())
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'account_manager')
);

-- Policy for clients to update their own uploads
CREATE POLICY "Clients can update their own uploads"
ON public.files
FOR UPDATE
TO authenticated
USING (uploaded_by = auth.uid())
WITH CHECK (uploaded_by = auth.uid());

-- Storage policy: Allow clients (ponto focal) to upload files to their client folder
CREATE POLICY "Clients can upload to storage"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'client-files' 
  AND public.is_ponto_focal(auth.uid(), (storage.foldername(name))[1]::uuid)
);

-- Storage policy: Allow clients to view files in their client folder
CREATE POLICY "Clients can view storage files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'client-files' 
  AND (
    public.get_user_client_id(auth.uid())::text = (storage.foldername(name))[1]
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'account_manager')
  )
);